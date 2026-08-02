import { type InferSchemaType, Schema, model } from 'mongoose';

const COMPONENT_ARCHIVE_STATUS = [
  'created',
  'downloaded',
  'stored',
  'failed',
  'deleted',
] as const;

const timelineEventSchema = new Schema(
  {
    status: {
      type: String,
      enum: COMPONENT_ARCHIVE_STATUS,
      required: true,
    },
    timestamp: { type: Date, default: Date.now, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const componentArchiveSchema = new Schema(
  {
    component: {
      type: Schema.Types.ObjectId,
      ref: 'disciplinas',
      required: true,
    },
    s3_key: { type: String },
    original_url: { type: String, required: true },
    file_name: { type: String },
    source: {
      type: String,
      enum: ['moodle', 'manual', 'sigaa'],
      required: true,
      default: 'moodle',
    },
    status: {
      type: String,
      enum: COMPONENT_ARCHIVE_STATUS,
      default: 'created',
      required: true,
    },
    timeline: { type: [timelineEventSchema], default: [] },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

componentArchiveSchema.index({ component: 1, status: 1 });
componentArchiveSchema.index(
  { component: 1, original_url: 1 },
  { unique: true }
);

export type ComponentArchive = InferSchemaType<typeof componentArchiveSchema>;

export const ComponentArchiveModel = model(
  'component_archives',
  componentArchiveSchema
);
