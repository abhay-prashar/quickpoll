const mongoose = require('mongoose');

const surveyVoteSchema = new mongoose.Schema(
  {
    surveySlug: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      required: true,
    },
    voterName: {
      type: String,
      default: null,
    },
    answers: [
      {
        questionIndex: { type: Number, required: true },
        optionIndex: { type: Number, required: true },
      },
    ],
    votedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

// Compound index to ensure one vote per IP per survey
surveyVoteSchema.index({ surveySlug: 1, ip: 1 }, { unique: true });

module.exports = mongoose.model('SurveyVote', surveyVoteSchema);
