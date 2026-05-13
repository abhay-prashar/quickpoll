const { customAlphabet } = require('nanoid');
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');
const mongoose = require('mongoose');

// 6-char slug: URL-safe, lowercase alphanumeric
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

// ─── Helper: expiry duration → Date ──────────────────────────────────────────
function resolveExpiry(expiry) {
  if (!expiry || expiry === 'never') return null;
  const now = Date.now();
  const durations = {
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
  };
  return durations[expiry] ? new Date(now + durations[expiry]) : null;
}

// ─── POST /api/polls ──────────────────────────────────────────────────────────
const createPoll = async (req, res, next) => {
  try {
    const { question, options, expiry } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'At least 2 options are required.' });
    }

    if (options.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 options allowed.' });
    }

    const sanitisedOptions = options
      .map((o) => ({ text: typeof o === 'string' ? o.trim() : String(o).trim(), votes: 0 }))
      .filter((o) => o.text.length > 0);

    if (sanitisedOptions.length < 2) {
      return res.status(400).json({ error: 'At least 2 non-empty options are required.' });
    }

    // Generate a unique slug (retry if collision)
    let slug;
    let attempts = 0;
    do {
      slug = nanoid();
      attempts++;
      if (attempts > 10) throw new Error('Failed to generate unique slug');
    } while (await Poll.exists({ slug }));

    const poll = await Poll.create({
      question: question.trim(),
      options: sanitisedOptions,
      slug,
      expiresAt: resolveExpiry(expiry),
    });

    res.status(201).json({ success: true, poll });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/polls/:slug ──────────────────────────────────────────────────────
const getPoll = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const poll = await Poll.findOne({ slug });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found.' });
    }

    const pollObj = poll.toJSON();
    // Add total votes
    pollObj.totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);

    res.json({ success: true, poll: pollObj });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/polls/:slug/vote ───────────────────────────────────────────────
const votePoll = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { optionIndex } = req.body;

    // 1. Validate optionIndex
    if (optionIndex === undefined || optionIndex === null || !Number.isInteger(optionIndex)) {
      return res.status(400).json({ error: 'optionIndex must be an integer.' });
    }

    // 2. Fetch poll
    const poll = await Poll.findOne({ slug });
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found.' });
    }

    // 3. Check expiry
    if (poll.expiresAt && new Date() > poll.expiresAt) {
      return res.status(410).json({ error: 'This poll has expired.', expired: true });
    }

    // 4. Validate optionIndex range
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ error: 'Invalid option index.' });
    }

    // 5. Get client IP
    const ip =
      req.ip ||
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.connection.remoteAddress ||
      'unknown';

    // 6. Atomic duplicate prevention via unique index
    //    Vote.create() will throw code 11000 if (pollSlug, ip) already exists.
    try {
      await Vote.create({ pollSlug: slug, ip, optionIndex });
    } catch (dupErr) {
      if (dupErr.code === 11000) {
        return res.status(409).json({ error: 'You have already voted on this poll.' });
      }
      throw dupErr;
    }

    // 7. Atomic $inc on the correct option
    const updatePath = `options.${optionIndex}.votes`;
    const updatedPoll = await Poll.findOneAndUpdate(
      { slug },
      { $inc: { [updatePath]: 1 } },
      { new: true }
    );

    const pollObj = updatedPoll.toJSON();
    pollObj.totalVotes = updatedPoll.options.reduce((sum, o) => sum + o.votes, 0);

    res.json({ success: true, poll: pollObj });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/polls/recent ────────────────────────────────────────────────────
const listRecentPolls = async (req, res, next) => {
  try {
    const now = new Date();
    const polls = await Poll.find({
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const withTotals = polls.map((p) => ({
      ...p,
      totalVotes: p.options.reduce((s, o) => s + o.votes, 0),
    }));

    res.json({ success: true, polls: withTotals });
  } catch (err) {
    next(err);
  }
};

module.exports = { createPoll, getPoll, votePoll, listRecentPolls };
