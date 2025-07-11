const RateLog = require('../models/RateLog');

const MAX_REPORTS = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

module.exports = async function rateLimiter(req, res, next) {
  let identity = null;

  if (req.user?.email) {
    identity = req.user.email;
  } else if (req.headers.authorization) {
    identity = req.headers.authorization.split(' ')[1];
  } else {
    identity = req.ip;
  }

  if (!identity) {
    return res.status(403).json({ error: 'Cannot identify requester' });
  }

  const since = new Date(Date.now() - WINDOW_MS);

  try {
    const recentLogs = await RateLog.find({
      token: identity,
      timestamp: { $gte: since }
    }).sort({ timestamp: 1 }); // sort oldest -> newest

    if (recentLogs.length >= MAX_REPORTS) {
      // Compute when the next slot becomes available
      const oldest = recentLogs[0]; // the first of the recent logs
      const nextAvailableAt = new Date(oldest.timestamp.getTime() + WINDOW_MS);

      // Log this failed attempt
      await RateLog.create({
        token: identity,
        timestamp: new Date(),
        success: false
      });

      return res.status(429).json({
        error: `Rate limit exceeded. Max ${MAX_REPORTS} reports allowed per 24 hours.`,
        nextAvailableAt: nextAvailableAt.toISOString()
      });
    }

    // Log this successful attempt
    await RateLog.create({
      token: identity,
      timestamp: new Date(),
      success: true
    });

    next();
  } catch (err) {
    console.error('Rate limit check failed:', err.message);
    return res.status(500).json({ error: 'Rate limit check failed' });
  }
};
