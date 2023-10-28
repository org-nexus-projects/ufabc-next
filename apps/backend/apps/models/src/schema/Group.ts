import { type InferSchemaType, Schema, model } from 'mongoose';

const groupSchema = new Schema(
  {
    disciplina: String,
    season: String,

    mainTeacher: {
      type: Schema.Types.ObjectId,
      ref: 'teachers',
      required: true,
    },

    users: [
      {
        type: Number,
        required: true,
      },
    ],
  },
  { timestamps: true },
);

groupSchema.index({ users: 'desc' });
groupSchema.index({ mainTeacher: 'desc', season: 'desc', disciplina: 'desc' });

export type Group = InferSchemaType<typeof groupSchema>;
export const GroupModel = model<Group>('groups', groupSchema);
