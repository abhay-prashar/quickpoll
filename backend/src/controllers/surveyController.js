const { customAlphabet } = require('nanoid');
const Survey = require('../models/Survey');
const SurveyVote = require('../models/SurveyVote');

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

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

// ─── POST /api/surveys ────────────────────────────────────────────────────────
const createSurvey = async (req, res, next) => {
  try {
    const { title, questions, expiry, requireName } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Survey title is required.' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'At least one question is required.' });
    }

    const sanitisedQuestions = questions.map((q) => {
      if (!q.text || typeof q.text !== 'string' || !q.text.trim()) {
        throw new Error('All questions must have text.');
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        throw new Error('All questions must have at least 2 options.');
      }
      const validOptions = q.options
        .map(o => ({ text: typeof o === 'string' ? o.trim() : String(o).trim(), votes: 0 }))
        .filter(o => o.text.length > 0);
      
      if (validOptions.length < 2) {
        throw new Error('All questions must have at least 2 valid options.');
      }
      return { text: q.text.trim(), options: validOptions };
    });

    let slug;
    let attempts = 0;
    do {
      slug = nanoid();
      attempts++;
      if (attempts > 10) throw new Error('Failed to generate unique slug');
    } while (await Survey.exists({ slug }));

    const survey = await Survey.create({
      title: title.trim(),
      questions: sanitisedQuestions,
      slug,
      expiresAt: resolveExpiry(expiry),
      requireName: Boolean(requireName),
    });

    res.status(201).json({ success: true, survey });
  } catch (err) {
    if (err.message.includes('All questions')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

// ─── GET /api/surveys/:slug ───────────────────────────────────────────────────
const getSurvey = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const survey = await Survey.findOne({ slug });

    if (!survey) return res.status(404).json({ error: 'Survey not found.' });

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [uniqueVoters, votesLastHour] = await Promise.all([
      SurveyVote.distinct('ip', { surveySlug: slug }).then(ips => ips.length),
      SurveyVote.countDocuments({ surveySlug: slug, votedAt: { $gte: oneHourAgo } })
    ]);

    const surveyObj = survey.toJSON();
    surveyObj.uniqueVoters = uniqueVoters;
    surveyObj.votesLastHour = votesLastHour;
    surveyObj.isExpired = surveyObj.expiresAt && new Date() > new Date(surveyObj.expiresAt);

    // Compute total votes per question
    surveyObj.questions.forEach(q => {
      q.totalVotes = q.options.reduce((sum, o) => sum + o.votes, 0);
    });

    res.json({ success: true, survey: surveyObj });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/surveys/:slug/vote ─────────────────────────────────────────────
const voteSurvey = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { answers, voterName } = req.body; // answers is array of optionIndex (index in array matches questionIndex)

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers must be an array.' });
    }

    const survey = await Survey.findOne({ slug });
    if (!survey) return res.status(404).json({ error: 'Survey not found.' });

    if (survey.expiresAt && new Date() > survey.expiresAt) {
      return res.status(410).json({ error: 'This survey has expired.', expired: true });
    }

    if (answers.length !== survey.questions.length) {
      return res.status(400).json({ error: 'You must answer all questions.' });
    }

    // Validate options
    const formattedAnswers = [];
    for (let i = 0; i < answers.length; i++) {
      const optionIndex = answers[i];
      if (optionIndex === undefined || optionIndex === null || optionIndex < 0 || optionIndex >= survey.questions[i].options.length) {
        return res.status(400).json({ error: `Invalid option for question ${i + 1}.` });
      }
      formattedAnswers.push({ questionIndex: i, optionIndex });
    }

    let finalVoterName = null;
    if (survey.requireName) {
      if (!voterName || typeof voterName !== 'string' || !voterName.trim()) {
        return res.status(400).json({ error: 'Your name is required to vote on this survey.' });
      }
      finalVoterName = voterName.trim();
    } else if (voterName && typeof voterName === 'string' && voterName.trim()) {
      finalVoterName = voterName.trim();
    }

    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress || 'unknown';

    try {
      await SurveyVote.create({ surveySlug: slug, ip, answers: formattedAnswers, voterName: finalVoterName });
    } catch (dupErr) {
      if (dupErr.code === 11000) {
        return res.status(409).json({ error: 'You have already voted on this survey.' });
      }
      throw dupErr;
    }

    // Atomic $inc for all answered options
    const incQuery = {};
    formattedAnswers.forEach((ans) => {
      incQuery[`questions.${ans.questionIndex}.options.${ans.optionIndex}.votes`] = 1;
    });

    const updatedSurvey = await Survey.findOneAndUpdate(
      { slug },
      { $inc: incQuery },
      { new: true }
    );

    res.json({ success: true, survey: updatedSurvey });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/surveys/:slug/votes ─────────────────────────────────────────────
const getSurveyVotes = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const survey = await Survey.findOne({ slug }).lean();
    if (!survey) return res.status(404).json({ error: 'Survey not found.' });

    const votes = await SurveyVote.find({ surveySlug: slug })
      .sort({ votedAt: -1 })
      .select('voterName answers votedAt -_id')
      .lean();

    const enrichedVotes = votes.map(v => ({
      voterName: v.voterName || 'Anonymous',
      votedAt: v.votedAt,
      answers: v.answers.map(ans => ({
        question: survey.questions[ans.questionIndex]?.text || 'Unknown',
        option: survey.questions[ans.questionIndex]?.options[ans.optionIndex]?.text || 'Unknown',
      }))
    }));

    res.json({ success: true, votes: enrichedVotes });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/surveys/recent ──────────────────────────────────────────────────
const listRecentSurveys = async (req, res, next) => {
  try {
    const now = new Date();
    const surveys = await Survey.find({
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const formatted = surveys.map((s) => {
      // Calculate total votes across all questions and divide by number of questions to get "total completions"
      let totalOptionVotes = 0;
      s.questions.forEach(q => q.options.forEach(o => totalOptionVotes += o.votes));
      const completions = s.questions.length ? Math.floor(totalOptionVotes / s.questions.length) : 0;
      return { ...s, totalVotes: completions };
    });

    res.json({ success: true, surveys: formatted });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSurvey, getSurvey, voteSurvey, getSurveyVotes, listRecentSurveys };
