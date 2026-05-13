// ─── Global Express Error Handler ─────────────────────────────────────────────
const errorHandler = (err, req, res, _next) => {
  console.error('[Error]', err.message);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join(' ') });
  }

  // Mongoose cast error (e.g. bad ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid data format.' });
  }

  // MongoDB duplicate key
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate entry.' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error.',
  });
};

module.exports = errorHandler;
