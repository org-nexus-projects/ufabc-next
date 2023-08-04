import { Schema, model } from 'mongoose';
import { EnrollmentModel } from './Enrollment';
import { ReactionModel } from './Reaction';

const commentSchema = new Schema(
  {
    comment: {
      type: String,
      required: true,
    },

    viewers: {
      type: Number,
      default: 0,
    },

    enrollment: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'enrollments',
    },

    type: {
      type: String,
      required: true,
      enum: ['teoria', 'pratica'],
    },

    ra: {
      type: String,
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'teachers',
      required: true,
    },

    subject: {
      type: Schema.Types.ObjectId,
      ref: 'subjects',
      required: true,
    },

    reactionsCount: Object,
  },
  { toObject: { virtuals: true }, timestamps: true },
);

commentSchema.pre('save', async function () {
  if (this.isNew) {
    const enrollment = await this.constructor
      // @ts-ignore
      // This one here, it only work, if in your service, you create a instance of `CommentModel`
      .findOne({
        enrollment: this.enrollment,
        active: true,
        type: this.type,
      })
      .lean(true);

    if (enrollment) {
      throw new Error(
        `Você só pode comentar uma vez neste vinculo ${this.enrollment}`,
      );
    }
  }
});

commentSchema.post('save', async function () {
  await EnrollmentModel.findOneAndUpdate(
    { _id: this.enrollment },
    { $addToSet: { comments: [this.type] } },
  );
});

commentSchema.post('find', async function () {
  await this.model.updateMany(this.getQuery(), { $inc: { viewers: 1 } });
});

commentSchema.static(
  'commentsByReactions',
  async function (
    query,
    userId,
    populateFields = ['enrollment', 'subject'],
    limit = 10,
    page = 0,
  ) {
    if (!userId) {
      throw new Error(`Usuário Não Encontrado ${userId}`);
    }

    const response = await this.find(query)
      .lean(true)
      .populate(populateFields)
      .skip(page * limit)
      .limit(limit)
      .sort({
        'reactionsCount.recommendation': -1,
        'reactionsCount.likes': -1,
        createdAt: -1,
      });
    await Promise.all(
      // TODO: refactor this monster
      response.map(async (r: any) => {
        r.myReactions = {
          like: !!(await ReactionModel.count({
            comment: String(r._id),
            user: String(userId),
            kind: 'like',
          })),
          recommendation: !!(await ReactionModel.count({
            comment: String(r._id),
            user: String(userId),
            kind: 'recommendation',
          })),
          star: !!(await ReactionModel.count({
            comment: String(r._id),
            user: String(userId),
            kind: 'star',
          })),
        };
        return r;
      }),
    );

    return { data: response, total: await this.count(query) };
  },
);

commentSchema.index({ comment: 1, user: 1 });
commentSchema.index({ reactionsCount: -1 });

commentSchema.index({
  'reactionsCount.recommendation': -1,
  'reactionsCount.likes': -1,
  createdAt: -1,
});

export const CommentModel = model('comments', commentSchema);
