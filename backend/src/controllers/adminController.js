const jwt = require('jsonwebtoken');
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');

const login = (req, res, next) => {
  try {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (password !== adminPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ role: 'admin' }, process.env.ADMIN_SECRET || 'fallback-secret', { expiresIn: '1d' });
    res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
};

const getPolls = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [polls, total] = await Promise.all([
      Poll.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Poll.countDocuments()
    ]);

    const withTotals = polls.map((p) => ({
      ...p,
      totalVotes: p.options.reduce((s, o) => s + o.votes, 0),
    }));

    res.json({ 
      success: true, 
      polls: withTotals, 
      pagination: { total, page, limit, pages: Math.ceil(total / limit) } 
    });
  } catch (err) {
    next(err);
  }
};

const deletePoll = async (req, res, next) => {
  try {
    const { slug } = req.params;
    await Poll.deleteOne({ slug });
    await Vote.deleteMany({ pollSlug: slug });
    res.json({ success: true, message: 'Poll deleted' });
  } catch (err) {
    next(err);
  }
};

const closePoll = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const poll = await Poll.findOneAndUpdate(
      { slug },
      { expiresAt: new Date() },
      { new: true }
    );
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    res.json({ success: true, poll });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getPolls, deletePoll, closePoll };
