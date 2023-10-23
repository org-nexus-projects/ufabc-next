import { type InferSchemaType, Schema, Types, model } from 'mongoose';
import { EnrollmentModel } from './Enrollment.js';
import { ReactionModel } from './Reaction.js';

const COMMENT_TYPE = ['teoria', 'pratica'] as const;

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
      type: Types.ObjectId,
      required: true,
      ref: 'enrollments',
    },

    type: {
      type: String,
      required: true,
      enum: COMMENT_TYPE,
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
      type: Types.ObjectId,
      ref: 'teachers',
      required: true,
    },

    subject: {
      type: Types.ObjectId,
      ref: 'subjects',
      required: true,
    },

    reactionsCount: Object,
    createdAt: NativeDate,
    updatedAt: NativeDate,
  },
  {
    statics: {
      async commentsByReaction(
        userId: string,
        populateFields: string[] = ['enrollment', 'subject'],
        limit: number = 10,
        page: number = 0,
        query,
      ) {
        if (!userId) {
          throw new Error(`Usuário Não Encontrado ${userId}`);
        }

        const comments = await this.find(query)
          .lean(true)
          .populate(populateFields)
          .skip(page * limit)
          .sort({
            'reactionsCount.recommendation': 'desc',
            'reactionsCount.likes': 'desc',
            createdAt: 'desc',
          });

        const commentsReaction = comments.map(async (comment) => {
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
          // @ts-expect-error Object is created dynamically
          comment.myReactions = {
            like: !!likes,
            recommendation: !!recommendations,
            star: !!stars,
          };

          return comment;
        });

        await Promise.all(commentsReaction);
        return { data: commentsReaction, total: await this.count(query) };
      },
    },
    toObject: { virtuals: true },
  },
);

commentSchema.pre('save', async function () {
  if (this.isNew) {
    const enrollment = await this.constructor
      // This one here, it only work, if in your service, you create a instance of `CommentModel`
      // @ts-expect-error
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

commentSchema.index({ comment: 'asc', user: 'asc' });
commentSchema.index({ reactionsCount: 'desc' });

commentSchema.index({
  'reactionsCount.recommendation': 'desc',
  'reactionsCount.likes': 'desc',
  createdAt: 'desc',
});

export type Comment = InferSchemaType<typeof commentSchema>;
export const CommentModel = model<Comment>('comments', commentSchema);
