const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    questions: [
      {
        text: {
          type: String,
          required: true,
          trim: true,
        },
        options: [
          {
            text: {
              type: String,
              required: true,
              trim: true,
            },
            votes: {
              type: Number,
              default: 0,
            },
          },
        ],
      },
    ],
    expiresAt: {
      type: Date,
      default: null, // null = never expires
    },
    requireName: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

surveySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Survey', surveySchema);
