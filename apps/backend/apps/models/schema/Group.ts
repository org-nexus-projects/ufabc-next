import { Schema, model } from 'mongoose';

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

groupSchema.index({ users: -1 });
groupSchema.index({ mainTeacher: -1, season: -1, disciplina: -1 });
//  models['groups'] ||
export const GroupModel = model('groups', groupSchema);
