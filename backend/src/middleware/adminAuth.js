const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_SECRET || 'fallback-secret');
    if (decoded.role !== 'admin') throw new Error('Invalid role');
    next();
  } catch (err) {
    res.status(403).json({ error: 'Forbidden' });
  }
};

module.exports = adminAuth;
