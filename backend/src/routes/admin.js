const express = require('express');
const router = express.Router();
const { login, getPolls, deletePoll, closePoll } = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

router.post('/login', login);
router.get('/polls', adminAuth, getPolls);
router.delete('/polls/:slug', adminAuth, deletePoll);
router.post('/polls/:slug/close', adminAuth, closePoll);

module.exports = router;
