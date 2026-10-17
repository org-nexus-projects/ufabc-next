import { UnrecoverableError } from 'bullmq';
import type { FastifyInstance } from 'fastify';

import { ExtractorConnector } from '@/connectors/extractor.js';
import {
  SUMMARY_COMMENT_THRESHOLD,
  SUMMARY_MAX_COMMENTS,
  SUMMARY_MAX_COMMENT_CHARS,
} from '@/constants.js';
import { CommentsRepository } from '@/repositories/comments-repository.js';
import { SummariesRepository } from '@/repositories/summaries-repository.js';
import { summarySchema } from '@/schemas/v2/extractor.js';

import { BaseService } from './base-service.js';

type SummaryGenerationDependencies = {
  config: FastifyInstance['config'];
  globalTraceId?: string;
};

export class SummaryGenerationService extends BaseService {
  private readonly extractorConnector: ExtractorConnector;
  private readonly commentsRepository: CommentsRepository;
  private readonly summariesRepository: SummariesRepository;

  constructor({ config, globalTraceId }: SummaryGenerationDependencies) {
    super({ globalTraceId });
    this.extractorConnector = new ExtractorConnector({
      baseUrl: config.EXTRACTOR_URL,
      globalTraceId: this.globalTraceId,
      internalToken: config.INTERNAL_TOKEN,
      token: config.SERVICE_HEADER,
    });
    this.commentsRepository = new CommentsRepository({ globalTraceId });
    this.summariesRepository = new SummariesRepository({ globalTraceId });
  }

  async hasEnoughNewComments(teacherId: string) {
    const latestSummary =
      await this.summariesRepository.findLatestActiveByTeacher(teacherId);

    const newComments = await this.commentsRepository.countActiveByTeacher(
      teacherId,
      latestSummary?.newestComment
    );

    return newComments >= SUMMARY_COMMENT_THRESHOLD;
  }

  async generateSummary(teacherId: string) {
    const hasEnoughNewComments = await this.hasEnoughNewComments(teacherId);
    if (!hasEnoughNewComments) {
      return { skipped: true, teacherId };
    }

    const comments = await this.commentsRepository.findRecentActiveByTeacher(
      teacherId,
      SUMMARY_MAX_COMMENTS
    );

    if (comments.length === 0) {
      throw new UnrecoverableError(
        `No active comments for teacher ${teacherId}`
      );
    }

    const commentTexts: string[] = [];
    const commentDates: Date[] = [];
    for (const comment of comments) {
      commentTexts.push(comment.comment.slice(0, SUMMARY_MAX_COMMENT_CHARS));
      commentDates.push(comment.createdAt);
    }

    const rawSummary =
      await this.extractorConnector.summarizeComments(commentTexts);
    const result = summarySchema.parse(rawSummary);
    const timestamps = commentDates.map((date) => date.getTime());

    const summary = await this.summariesRepository.create({
      commentsCount: comments.length,
      didacticQuality: result.didactic_quality,
      model: result.model,
      newestComment: new Date(Math.max(...timestamps)),
      oldestComment: new Date(Math.min(...timestamps)),
      promptVersion: result.prompt_version,
      summary: result.summary,
      takesAttendance: result.takes_attendance,
      teacher: teacherId,
      usesMoodle: result.uses_moodle,
      usesSigaa: result.uses_sigaa,
    });

    this.logger.info(
      { commentsCount: comments.length, teacherId },
      'teacher summary stored'
    );

    return { summaryId: summary._id.toString(), teacherId };
  }
}
