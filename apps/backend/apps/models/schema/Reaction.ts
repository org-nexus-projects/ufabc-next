import type { Reaction, ReactionDocument } from '@ufabcnext/types';
import { isObjectIdOrHexString } from 'mongoose';
import { Schema } from 'mongoose';
import { UserModel } from './User';
import { CommentModel } from './Comment';
import { EnrollmentModel } from './Enrollment';
import { model } from 'mongoose';

const reactionSchema = new Schema<Reaction>(
  {
    kind: {
      type: String,
      required: true,
      enum: ['like', 'recommendation', 'star'],
    },

    comment: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'comments',
    },

    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'users',
    },

    active: {
      type: Boolean,
      default: true,
    },

    slug: {
      type: String,
    },
  },
  { timestamps: true },
);

async function validateRules(reaction: ReactionDocument) {
  if (reaction.kind == 'recommendation') {
    const isValidId = isObjectIdOrHexString;

    const user = isValidId(reaction.user)
      ? await UserModel.findById(reaction.user)
      : reaction.user;

    const comment = isValidId(reaction.comment)
      ? await CommentModel.findById(reaction.comment)
      : reaction.comment;

    const isValid = await EnrollmentModel.findOne({
      ra: user?._id,
      $or: [{ teoria: comment?.teacher }, { pratica: comment?.teacher }],
    });
    if (!isValid)
      throw new Error(
        'Você não pode recomendar este comentário, pois não fez nenhuma matéria com este professor',
      );
  }
}

// TODO: understand and fix this later
async function computeReactions(reaction: ReactionDocument) {
  const commentId = reaction.comment._id && reaction.comment;

  // eslint-disable-next-line
  // @ts-ignore
  // eslint-disable-next-line
  const reactionCount = await reaction.constructor.count({
    comment: commentId,
    kind: reaction.kind,
  });

  const updateReactionKind = {
    // eslint-disable-next-line
    [`reactionsCount.${reaction.kind}`]: reactionCount,
  };
  await CommentModel.findOneAndUpdate(
    { _id: commentId },
    {
      $set: updateReactionKind,
    },
  );
}

reactionSchema.pre('save', async function () {
  const slug = `${this.kind}:${this.comment._id}:${this.user._id}`;
  if (this.isNew) {
    // eslint-disable-next-line
    // @ts-ignore
    // eslint-disable-next-line
    const equalReaction = await this.constructor.findOne({ slug });
    if (equalReaction) {
      throw new Error(
        'Você não pode reagir duas vezes iguais ao mesmo comentário',
      );
    }
    this.slug = slug;
  }

  await validateRules(this);
});

reactionSchema.post('save', async function () {
  await computeReactions(this);
});

// This Type is WRONG, but it will do for now
reactionSchema.post('deleteOne', async function (this: ReactionDocument) {
  await computeReactions(this);
});

reactionSchema.index({ comment: 1, kind: 1 });

export const ReactionModel = model<Reaction>('reactions', reactionSchema);
