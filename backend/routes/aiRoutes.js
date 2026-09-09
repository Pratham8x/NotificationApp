const express = require('express');
const authenticate = require('../middleware/auth');
const {
  chatWithGemini,
  getConversation,
} = require('../controllers/aiController');
const { issueLiveToken } = require('../controllers/liveTokenController');
const router = express.Router();
router.get('/messages', authenticate, getConversation);
router.post('/live-token', authenticate, issueLiveToken);
// Bounded per-process admission control. Use gateway limits across multiple replicas.
const requests = new Map();
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of requests)
    if (entry.reset <= now && !entry.active) requests.delete(id);
}, 60000);
cleanup.unref();
router.post('/chat', authenticate, (req, res, next) => {
  const id = String(req.user._id);
  const now = Date.now();
  let entry = requests.get(id);
  if (entry?.active || (entry && entry.reset > now && entry.count >= 10)) {
    res.set('Retry-After', '60');
    return res.status(429).json({
      success: false,
      message: 'Please wait before sending another message.',
    });
  }
  if (!entry || entry.reset <= now) {
    if (!entry && requests.size >= 10000)
      return res.status(503).json({
        success: false,
        message: 'AI is busy. Please try again later.',
      });
    entry = { count: 0, reset: now + 60000, active: false };
    requests.set(id, entry);
  }
  entry.count += 1;
  entry.active = true;
  Promise.resolve(chatWithGemini(req, res))
    .catch(next)
    .finally(() => {
      entry.active = false;
    });
});
module.exports = router;
