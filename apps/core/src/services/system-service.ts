import { randomUUID } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { monitorEventLoopDelay, type IntervalHistogram } from 'node:perf_hooks';
import { writeHeapSnapshot } from 'node:v8';

import type { Mongoose } from 'mongoose';
import type { Redis } from 'ioredis';
import type { Logger } from 'pino';

import type { S3Connector } from '@/connectors/s3-connector.js';
import {
  BYTES_PER_MB,
  NANOSECONDS_PER_MS,
  SNAPSHOT_URL_TTL_SECONDS,
} from '@/constants.js';
import { logger as baseLogger } from '@/utils/logger.js';

type MemorySample = {
  rssMB: number;
  heapUsedMB: number;
  heapTotalMB: number;
  externalMB: number;
  arrayBuffersMB: number;
  eventLoopDelayMeanMs: number;
  eventLoopDelayMaxMs: number;
  mongooseReadyState: number;
  redisStatus: string;
  activeResourceCount: number;
  activeResourcesByType: Record<string, number>;
};

type ThresholdContext = {
  rssMB: number;
  thresholdMB: number;
  snapshotUrl: string | null;
};

export class SystemService {
  private readonly mongoose: Mongoose;
  private readonly redis: Redis;
  private readonly s3Connector: S3Connector;
  private readonly bucket: string;
  private readonly snapshotThresholdMB: number;
  private readonly sampleIntervalSeconds: number;
  private readonly snapshotCooldownMinutes: number;
  private readonly logger: Logger;
  private readonly eventLoopDelayHistogram: IntervalHistogram;
  private sampleIntervalHandle: NodeJS.Timeout | undefined;
  private lastSnapshotAt = 0;
  private lastThresholdContext: ThresholdContext | null = null;

  constructor({
    mongoose,
    redis,
    s3Connector,
    bucket,
    snapshotThresholdMB,
    sampleIntervalSeconds,
    snapshotCooldownMinutes,
  }: {
    mongoose: Mongoose;
    redis: Redis;
    s3Connector: S3Connector;
    bucket: string;
    snapshotThresholdMB: number;
    sampleIntervalSeconds: number;
    snapshotCooldownMinutes: number;
  }) {
    this.mongoose = mongoose;
    this.redis = redis;
    this.s3Connector = s3Connector;
    this.bucket = bucket;
    this.snapshotThresholdMB = snapshotThresholdMB;
    this.sampleIntervalSeconds = sampleIntervalSeconds;
    this.snapshotCooldownMinutes = snapshotCooldownMinutes;
    this.logger = baseLogger.child({ module: 'memory-monitor' });
    this.eventLoopDelayHistogram = monitorEventLoopDelay({ resolution: 20 });
  }

  startMemoryMonitor(): void {
    this.eventLoopDelayHistogram.enable();
    const intervalMs = this.sampleIntervalSeconds * 1000;
    this.sampleIntervalHandle = setInterval(
      () => this.sampleMemory(),
      intervalMs
    );
    this.sampleIntervalHandle.unref();
    this.logger.info(
      {
        intervalSeconds: this.sampleIntervalSeconds,
        thresholdMB: this.snapshotThresholdMB,
      },
      'Memory monitor started'
    );
  }

  stopMemoryMonitor(): void {
    if (this.sampleIntervalHandle) {
      clearInterval(this.sampleIntervalHandle);
      this.sampleIntervalHandle = undefined;
    }
    this.eventLoopDelayHistogram.disable();
  }

  getLastThresholdContext(): ThresholdContext | null {
    return this.lastThresholdContext;
  }

  private toMB(bytes: number): number {
    return Math.round((bytes / BYTES_PER_MB) * 100) / 100;
  }

  private getActiveResourceStats() {
    const activeResourceTypes = process.getActiveResourcesInfo();
    const countByType: Record<string, number> = {};
    for (const resourceType of activeResourceTypes) {
      const currentCount = countByType[resourceType] ?? 0;
      countByType[resourceType] = currentCount + 1;
    }

    return {
      activeResourceCount: activeResourceTypes.length,
      activeResourcesByType: countByType,
    };
  }

  private sampleMemory(): void {
    const globalTraceId = randomUUID();
    const tickLogger = this.logger.child({ globalTraceId });

    const memoryUsage = process.memoryUsage();
    const eventLoopDelayMeanMs =
      this.eventLoopDelayHistogram.mean / NANOSECONDS_PER_MS;
    const eventLoopDelayMaxMs =
      this.eventLoopDelayHistogram.max / NANOSECONDS_PER_MS;
    this.eventLoopDelayHistogram.reset();

    const sample: MemorySample = {
      rssMB: this.toMB(memoryUsage.rss),
      heapUsedMB: this.toMB(memoryUsage.heapUsed),
      heapTotalMB: this.toMB(memoryUsage.heapTotal),
      externalMB: this.toMB(memoryUsage.external),
      arrayBuffersMB: this.toMB(memoryUsage.arrayBuffers),
      eventLoopDelayMeanMs,
      eventLoopDelayMaxMs,
      mongooseReadyState: this.mongoose.connection.readyState,
      redisStatus: this.redis.status,
      ...this.getActiveResourceStats(),
    };

    tickLogger.info(
      { event: 'memory.sample', ...sample },
      'Memory usage sample'
    );

    const cooldownMs = this.snapshotCooldownMinutes * 60_000;
    const isAboveThreshold = sample.rssMB > this.snapshotThresholdMB;
    const isCooldownElapsed = Date.now() - this.lastSnapshotAt > cooldownMs;

    if (isAboveThreshold && isCooldownElapsed) {
      this.lastSnapshotAt = Date.now();
      this.handleMemoryThresholdExceeded(
        { ...sample, thresholdMB: this.snapshotThresholdMB },
        globalTraceId,
        tickLogger
      ).catch((error) => {
        tickLogger.error(
          { err: error },
          'Failed to handle memory threshold exceeded'
        );
      });
    }
  }

  private async handleMemoryThresholdExceeded(
    context: MemorySample & { thresholdMB: number },
    globalTraceId: string,
    tickLogger: Logger
  ): Promise<void> {
    const snapshotUrl = await this.captureAndUploadHeapSnapshot(
      globalTraceId,
      tickLogger
    );

    this.lastThresholdContext = {
      rssMB: context.rssMB,
      thresholdMB: context.thresholdMB,
      snapshotUrl,
    };

    tickLogger.error(
      {
        event: 'memory.threshold_exceeded',
        ...context,
        snapshotUrl,
      },
      `Memory usage exceeded ${context.thresholdMB}MB threshold`
    );
  }

  private async captureAndUploadHeapSnapshot(
    globalTraceId: string,
    tickLogger: Logger
  ): Promise<string | null> {
    const snapshotFilename = `heap-${process.pid}-${Date.now()}.heapsnapshot`;
    const snapshotPath = join(tmpdir(), snapshotFilename);

    try {
      writeHeapSnapshot(snapshotPath);

      const snapshotBuffer = await readFile(snapshotPath);
      const s3Key = `heap-snapshots/${snapshotFilename}`;

      await this.s3Connector.upload(this.bucket, s3Key, snapshotBuffer);

      return await this.s3Connector.getPresignedUrl(
        this.bucket,
        s3Key,
        SNAPSHOT_URL_TTL_SECONDS
      );
    } catch (error) {
      tickLogger.error(
        { err: error, globalTraceId },
        'Failed to capture or upload heap snapshot'
      );
      return null;
    } finally {
      await unlink(snapshotPath).catch(() => {});
    }
  }
}
