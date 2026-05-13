const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    pollSlug: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      required: true,
    },
    optionIndex: {
      type: Number,
      required: true,
    },
    votedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

// ─── Compound unique index: one vote per IP per poll ─────────────────────────
// This is the core of our atomic duplicate prevention.
// When two simultaneous requests try to insert the same (pollSlug, ip),
// MongoDB will throw a duplicate key error (code 11000) for the second one.
voteSchema.index({ pollSlug: 1, ip: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
