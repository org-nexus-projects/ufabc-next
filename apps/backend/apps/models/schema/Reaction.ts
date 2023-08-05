import { isObjectIdOrHexString } from 'mongoose';
import { Schema } from 'mongoose';
import { UserModel } from './User';
import { CommentModel } from './Comment';
import { EnrollmentModel } from './Enrollment';
import { model } from 'mongoose';

const reactionSchema = new Schema(
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

async function validateRules(reaction: unknown) {
  if (reaction.kind == 'recommendation') {
    const isValidId = isObjectIdOrHexString;

    const user = isValidId(reaction.user)
      ? await UserModel.findById(reaction.user)
      : reaction.user;

    const comment = isValidId(reaction.comment)
      ? await CommentModel.findById(reaction.comment)
      : reaction.comment;

    const isValid = await EnrollmentModel.findOne({
      ra: user.ra,
      $or: [{ teoria: comment.teacher }, { pratica: comment.teacher }],
    });
    if (!isValid)
      throw new Error(
        'Você não pode recomendar este comentário, pois não fez nenhuma matéria com este professor',
      );
  }
}

async function computeReactions(doc: unknown) {
  const commentId = doc.comment._id && doc.comment;
  await CommentModel.findOneAndUpdate(
    { _id: commentId },
    {
      [`reactionsCount.${doc.kind}`]: await doc.constructor.count({
        comment: commentId,
        kind: doc.kind,
      }),
    },
  );
}

reactionSchema.pre('save', async function () {
  const slug = `${this.kind}:${this.comment._id}:${this.user._id}`;
  if (this.isNew) {
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

reactionSchema.post('deleteOne', async function () {
  await computeReactions(this);
});

reactionSchema.index({ comment: 1, kind: 1 });

export const ReactionModel = model('reactions', reactionSchema);
