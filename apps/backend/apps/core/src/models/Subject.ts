import { type InferSchemaType, Schema, model } from 'mongoose';

const subjectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    search: {
      type: String,
      required: true,
    },
    creditos: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

subjectSchema.index({ name: 'asc', search: 'asc' }, { unique: true });

subjectSchema.pre('save', async function () {
  const existingSubject = await SubjectModel.findOne({
    $or: [{ name: this.name }, { search: this.search }],
  });

  if (!existingSubject) {
    return;
  }

  const error = new Error(
    `Subject with name "${this.name}" or search "${this.search}" already exists.`,
  );

  throw error;
});

export type Subject = InferSchemaType<typeof subjectSchema>;
export type SubjectDocument = ReturnType<(typeof SubjectModel)['hydrate']>;
export const SubjectModel = model('subjects', subjectSchema);
