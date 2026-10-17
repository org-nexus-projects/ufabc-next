import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const componentPlanSchema = new Schema(
  {
    // null for plans migrated from the legacy disciplinas_metadata collection
    archive: {
      default: null,
      ref: 'component_archives',
      type: Schema.Types.ObjectId,
    },
    component: {
      ref: 'disciplinas',
      required: true,
      type: Schema.Types.ObjectId,
    },
    extractedAt: { required: true, type: Date },
    planning: {
      _id: false,
      assessment: { required: true, type: String },
      methodology: { required: true, type: String },
      objectives: { required: true, type: String },
      syllabus: { required: true, type: String },
    },
    schedule: [
      {
        _id: false,
        date: { required: true, type: String },
        lesson: { required: true, type: String },
      },
    ],
    timetable: { default: [], type: [String] },
  },
  { timestamps: true }
);

componentPlanSchema.index({ component: 1, extractedAt: -1 });
componentPlanSchema.index(
  { archive: 1 },
  { partialFilterExpression: { archive: { $type: 'objectId' } }, unique: true }
);

export type ComponentPlan = InferSchemaType<typeof componentPlanSchema>;

export const ComponentPlanModel = model(
  'component_plans',
  componentPlanSchema,
  'component_plans'
);
