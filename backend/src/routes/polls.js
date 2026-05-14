const express = require('express');
const rateLimit = require('express-rate-limit');
const { createPoll, getPoll, votePoll, listRecentPolls, getPollVotes } = require('../controllers/pollController');

const router = express.Router();

const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many vote requests. Please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/recent', listRecentPolls);        // ← must come before /:slug
router.post('/', createPoll);
router.get('/:slug', getPoll);
router.get('/:slug/votes', getPollVotes);
router.post('/:slug/vote', voteLimiter, votePoll);

module.exports = router;
