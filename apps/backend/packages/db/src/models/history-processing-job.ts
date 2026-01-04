import {
  type HydratedDocument,
  Schema,
  model,
  type InferSchemaType,
} from 'mongoose';

const PROCESSING_STATUS = [
  'created',
  'processing',
  'completed',
  'failed',
  'in_queue',
] as const;
export type ProcessingStatus = (typeof PROCESSING_STATUS)[number];

const SOURCE = ['webhook', 'retry', 'manual'] as const;
export type JobSource = (typeof SOURCE)[number];

const timelineEventSchema = new Schema(
  {
    status: {
      type: String,
      enum: PROCESSING_STATUS,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

export interface HistoryProcessingJobMethods {
  transition(
    status: ProcessingStatus,
    metadata?: Record<string, unknown>
  ): Promise<this>;
  markFailed(
    error: {
      code: string;
      message: string;
      details: Record<string, unknown> | null | undefined;
    },
    metadata?: Record<string, unknown>
  ): Promise<this>;
  addTimelineEvent(
    status: ProcessingStatus,
    metadata?: Record<string, unknown>
  ): void;
}

const historyProcessingJobSchema = new Schema(
  {
    ra: {
      type: String,
      required: true,
      index: true,
      comment: 'Student registration number',
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      comment: 'Unique key for idempotency (ra + timestamp)',
    },
    status: {
      type: String,
      enum: PROCESSING_STATUS,
      default: 'created',
      index: true,
      comment: 'Current processing status',
    },
    timeline: {
      type: [timelineEventSchema],
      default: [],
      comment: 'Timeline of all status changes',
    },
    payload: {
      type: Schema.Types.Mixed,
      comment: 'Raw webhook payload for debugging',
    },
    error: {
      code: {
        type: String,
        comment: 'Error code from parser',
      },
      message: {
        type: String,
        comment: 'Error message',
      },
      details: {
        type: Schema.Types.Mixed,
        comment: 'Additional error details',
      },
    },
    retryCount: {
      type: Number,
      default: 0,
      comment: 'Number of retry attempts',
    },
    maxRetries: {
      type: Number,
      default: 3,
      comment: 'Maximum retry attempts allowed',
    },
    traceId: {
      type: String,
      comment: 'Correlation ID from global-trace-id header',
    },
    source: {
      type: String,
      enum: SOURCE,
      default: 'webhook',
      comment: 'Source of the job',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for efficient queries
historyProcessingJobSchema.index({ status: 1, createdAt: 1 });
historyProcessingJobSchema.index({ idempotencyKey: 1 });
historyProcessingJobSchema.index({ ra: 1, createdAt: -1 });

// TTL index - auto-delete after 7 days for completed/failed jobs
historyProcessingJobSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 604800, // 7 days
    partialFilterExpression: {
      status: { $in: ['completed', 'failed'] },
    },
  }
);

// Methods
historyProcessingJobSchema.method(
  'addTimelineEvent',
  function (
    this: HydratedDocument<HistoryProcessingJob, HistoryProcessingJobMethods>,
    status: ProcessingStatus,
    metadata?: Record<string, unknown>
  ) {
    this.timeline.push({
      status,
      timestamp: new Date(),
      metadata: metadata || {},
    });
  }
);

historyProcessingJobSchema.method(
  'transition',
  async function (
    this: HydratedDocument<HistoryProcessingJob, HistoryProcessingJobMethods>,
    status: ProcessingStatus,
    metadata?: Record<string, unknown>
  ) {
    this.status = status;
    this.addTimelineEvent(status, metadata);
    return this.save();
  }
);

historyProcessingJobSchema.method(
  'markFailed',
  function (
    this: HydratedDocument<HistoryProcessingJob, HistoryProcessingJobMethods>,
    error: { code: string; message: string; details?: Record<string, unknown> },
    metadata?: Record<string, unknown>
  ) {
    this.error = {
      code: error.code,
      message: error.message,
      details: error.details,
    };
    this.addTimelineEvent('failed', { error, ...metadata });
    return this.transition('failed', metadata);
  }
);

export type HistoryProcessingJob = InferSchemaType<
  typeof historyProcessingJobSchema
>;
export type HistoryProcessingJobDocument = HydratedDocument<
  HistoryProcessingJob,
  HistoryProcessingJobMethods
>;

export const HistoryProcessingJobModel = model<HistoryProcessingJobDocument>(
  'history_processing_jobs',
  historyProcessingJobSchema
);
