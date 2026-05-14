const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    votes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const pollSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: (opts) => opts.length >= 2 && opts.length <= 10,
        message: 'A poll must have between 2 and 10 options.',
      },
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null, // null = never expires
    },
    requireName: {
      type: Boolean,
      default: false,
    },
  },
  { versionKey: false }
);

// Virtual: is the poll still active?
pollSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

pollSchema.set('toJSON', { virtuals: true });
pollSchema.set('toObject', { virtuals: true });

// TTL Index to automatically delete expired polls
pollSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Poll', pollSchema);
