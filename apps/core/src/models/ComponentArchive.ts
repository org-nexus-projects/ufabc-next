import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const COMPONENT_ARCHIVE_STATUS = [
  'created',
  'downloaded',
  'stored',
  'failed',
  'deleted',
] as const;

const timelineEventSchema = new Schema(
  {
    metadata: { type: Schema.Types.Mixed },
    status: {
      enum: COMPONENT_ARCHIVE_STATUS,
      required: true,
      type: String,
    },
    timestamp: { default: Date.now, required: true, type: Date },
  },
  { _id: false }
);

const componentArchiveSchema = new Schema(
  {
    checksum: { type: String },
    component: {
      ref: 'disciplinas',
      required: true,
      type: Schema.Types.ObjectId,
    },
    file_name: { type: String },
    original_url: { required: true, type: String },
    s3_key: { type: String },
    source: {
      default: 'moodle',
      enum: ['moodle', 'manual', 'sigaa', 'cmcc'],
      required: true,
      type: String,
    },
    status: {
      default: 'created',
      enum: COMPONENT_ARCHIVE_STATUS,
      required: true,
      type: String,
    },
    timeline: { default: [], type: [timelineEventSchema] },
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
