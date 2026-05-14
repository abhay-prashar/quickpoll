const express = require('express');
const rateLimit = require('express-rate-limit');
const { createSurvey, getSurvey, voteSurvey, getSurveyVotes, listRecentSurveys } = require('../controllers/surveyController');

const router = express.Router();

const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many vote requests. Please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/recent', listRecentSurveys);
router.post('/', createSurvey);
router.get('/:slug', getSurvey);
router.get('/:slug/votes', getSurveyVotes);
router.post('/:slug/vote', voteLimiter, voteSurvey);

module.exports = router;
