import type { Comment, ICommentModel } from '@ufabcnext/types';
import { FilterQuery, Schema, model, models } from 'mongoose';
import { EnrollmentModel } from './Enrollment';
import { ReactionModel } from './Reaction';

const commentSchema = new Schema<Comment, ICommentModel>(
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

commentSchema.static(
  'commentsByReaction',
  async function (
    query: FilterQuery<Comment>,
    userId: string,
    populateFields: string[] = ['enrollment', 'subject'],
    limit: number = 10,
    page: number = 0,
  ) {
    if (!userId) {
      throw new Error(`Usuário Não Encontrado ${userId}`);
    }

    const comments = await this.find(query)
      .lean(true)
      .populate(populateFields)
      .skip(page * limit)
      .limit(limit)
      .sort({
        'reactionsCount.recommendation': -1,
        'reactionsCount.likes': -1,
        createdAt: -1,
      });

    const mapCommentsReaction = comments.map(async (comment) => {
      const likes = await ReactionModel.countDocuments({
        comment: comment._id,
        user: userId,
        kind: 'like',
      });
      const recommendations = await ReactionModel.countDocuments({
        comment: comment._id,
        user: userId,
        kind: 'recommendation',
      });
      const stars = await ReactionModel.countDocuments({
        comment: comment._id,
        user: userId,
        kind: 'star',
      });
      // eslint-disable-next-line
      // @ts-expect-error Object is created dynamically
      comment.myReactions = {
        like: !!likes,
        recommendation: !!recommendations,
        star: !!stars,
      };

      return comment;
    });
    await Promise.all(mapCommentsReaction);
    return { data: mapCommentsReaction, total: await this.count(query) };
  },
);

commentSchema.pre('save', async function () {
  if (this.isNew) {
    // eslint-disable-next-line
    const enrollment = await this.constructor
      // This one here, it only work, if in your service, you create a instance of `CommentModel`
      // eslint-disable-next-line
      // @ts-ignore
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

commentSchema.index({ comment: 1, user: 1 });
commentSchema.index({ reactionsCount: -1 });

commentSchema.index({
  'reactionsCount.recommendation': -1,
  'reactionsCount.likes': -1,
  createdAt: -1,
});

export const CommentModel =
  models['comments'] ||
  model<Comment, ICommentModel>('comments', commentSchema);
