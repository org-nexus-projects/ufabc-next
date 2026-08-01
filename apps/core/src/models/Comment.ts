import {
  type AnyObject,
  type QueryFilter as FilterQuery,
  type InferSchemaType,
  type PopulateOptions,
  Schema,
  type Types,
  model,
} from 'mongoose';

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
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      ref: 'teachers',
      required: true,
    },

    subject: {
      type: Schema.Types.ObjectId,
      ref: 'subjects',
      required: true,
    },

    reactionsCount: {
      like: {
        type: Number,
        default: 0,
        required: false,
      },
      recommendation: {
        type: Number,
        default: 0,
        required: false,
      },
      star: {
        type: Number,
        default: 0,
        required: false,
      },
    },
  },
  {
    statics: {
      async commentsByReaction(
        query: FilterQuery<AnyObject>,
        userId: Types.ObjectId,
        populateFields: (string | PopulateOptions)[] = [
          { path: 'enrollment', select: '-ra' },
          'subject',
        ],
        limit = 10,
        page = 0
      ) {
        if (!userId) {
          throw new Error(`Usuário Não Encontrado ${userId}`);
        }

        const comments = await this.find(query, '-ra')
          .lean(true)
          .populate(populateFields)
          .skip(page * limit)
          .limit(limit)
          .sort({
            createdAt: 'desc',
            'reactionsCount.recommendation': 'desc',
            'reactionsCount.likes': 'desc',
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

          // @ts-ignore dynmaic obj property
          comment.myReactions = {
            like: !!likes,
            recommendation: !!recommendations,
            star: !!stars,
          };

          return comment;
        });

        await Promise.all(commentsReaction);
        return { data: comments, total: await this.countDocuments(query) };
      },
    },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

commentSchema.pre('save', async function () {
  if (this.isNew) {
    const enrollmentDocument = this.collection;
    const enrollment = await enrollmentDocument.findOne({
      enrollment: this.enrollment,
      active: true,
      type: this.type,
    });
    if (enrollment) {
      throw new Error(
        `Você só pode comentar uma vez neste vinculo ${this.enrollment}`
      );
    }
  }
});

commentSchema.post('save', async function () {
  await EnrollmentModel.findOneAndUpdate(
    { _id: this.enrollment },
    { $addToSet: { comments: [this.type] } }
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
export type CommentDocument = ReturnType<(typeof CommentModel)['hydrate']>;
export const CommentModel = model('comments', commentSchema);
