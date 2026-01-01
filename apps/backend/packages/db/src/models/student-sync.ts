import { type HydratedDocument, Schema, model, type InferSchemaType } from 'mongoose';

const status = ['created', 'awaiting', 'processing', 'completed', 'failed'] as const;

export type OperationStatus = (typeof status)[number];

const timelineEventSchema = new Schema(
  {
    status: {
      type: String,
      required: true,
      enum: status,
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
  { _id: false },
);

const studentSyncSchema = new Schema(
  {
    ra: {
      type: String,
      required: true,
      index: true,
      comment: 'Student registration number',
    },
    status: {
      type: String,
      enum: status,
      default: 'created',
      comment: 'Current operation status',
    },
    timeline: {
      type: [timelineEventSchema],
      default: [],
      comment: 'Timeline of all status changes',
    },
    payload: {
      type: Schema.Types.Mixed,
      comment: 'Raw payload data for debugging',
    },
    error: {
      type: String,
      comment: 'Error message if operation failed',
    },
    externalIds: {
      serviceId: String,
      jobId: String,
      webhookId: String,
    },
    metrics: {
      totalDuration: Number, // in milliseconds
      stepDurations: {
        type: Map,
        of: Number,
        default: new Map(),
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type SyncStudent = InferSchemaType<typeof studentSyncSchema>;

export interface StudentSyncMethods {
  transition(status: OperationStatus, metadata?: Record<string, unknown>): Promise<this>;
  markFailed(error: string, metadata?: Record<string, unknown>): Promise<this>;
}

export type StudentSyncDocument = HydratedDocument<SyncStudent, StudentSyncMethods>;

studentSyncSchema.method('transition', async function(
  this: StudentSyncDocument, 
  status: OperationStatus, 
  metadata?: Record<string, unknown>
) {
  const previousStatus = this.status;
  this.status = status;

  const now = new Date();
  
  // Safe access to timeline thanks to inference
  const lastEvent = this.timeline.at(-1);

  if (lastEvent) {
    const stepDuration = now.getTime() - lastEvent.timestamp.getTime();
    const stepName = `${previousStatus}_to_${status}`;

    // Initialize if missing (defensive coding)
    if (!this.metrics) this.metrics = { totalDuration: 0, stepDurations: new Map() };
    if (!this.metrics.stepDurations) this.metrics.stepDurations = new Map();

    // Using Map API
    this.metrics.stepDurations.set(stepName, stepDuration);
    this.metrics.totalDuration = (this.metrics.totalDuration || 0) + stepDuration;
  }

  this.timeline.push({
    status,
    timestamp: now,
    metadata: metadata || {},
  });

  return this.save();
});

studentSyncSchema.method('markFailed', function(
  this: StudentSyncDocument, 
  error: string, 
  metadata?: Record<string, unknown>
) {
  this.error = error;
  return this.transition('failed', { error, ...metadata });
});

export const StudentSync = model<StudentSyncDocument>(
  'student_sync',
  studentSyncSchema,
);
