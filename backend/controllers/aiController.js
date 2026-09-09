const {withAiDeadline} = require('../services/aiDeadline');
const {randomUUID} = require('node:crypto');
const {generateAnswer, GEMINI_MODEL} = require('../services/geminiService');
const {getContext} = require('../services/aiContextService');
const {logAi, configuration, errorDetails} = require('../services/aiDiagnostics');
async function chatWithGemini(req, res) {
  const {message, history = []} = req.body || {};
  if (typeof message !== 'string' || !message.trim() || message.length > 2000) {
    return res.status(400).json({success: false, message: 'message must be a non-empty string of at most 2000 characters'});
  }
  if (!Array.isArray(history) || history.length > 10 || history.some((item, i) =>
    !item || item.role !== (i % 2 === 0 ? 'user' : 'model') || typeof item.text !== 'string' || !item.text.trim() || item.text.length > 8000) || history.length % 2 !== 0) {
    return res.status(400).json({success: false, message: 'Invalid conversation history'});
  }
  const started = Date.now();
  const requestId = randomUUID();
  res.set?.('X-AI-Request-ID', requestId);
  logAi('chat_started', {requestId, model: GEMINI_MODEL, ...configuration()});
  let stage = 'context';
  try {
    const answer = await withAiDeadline(async signal => {
      const context = await getContext(message.trim(), signal);
      signal.throwIfAborted();
      stage = 'generation';
      logAi('generation_started', {requestId, durationMs: Date.now() - started});
      return generateAnswer(message.trim(), context, history, signal);
    });
    logAi('generation_succeeded', {requestId, durationMs: Date.now() - started});
    return res.json({success: true, answer});
  } catch (error) {
    // Log only allowlisted metadata; never raw SDK errors, keys or prompts.
    const upstreamStatus = Number(error.status);
    let status = 502;
    let code = 'AI_UPSTREAM_ERROR';
    let errorMessage = 'AI is temporarily unavailable. Please try again later.';
    if (error.code === 'AI_TIMEOUT') {
      status = 504;
      code = 'AI_TIMEOUT';
      errorMessage = 'AI took too long to respond. Please try again.';
    } else if (error.code === 'AI_NOT_CONFIGURED') {
      status = 503;
      code = 'AI_NOT_CONFIGURED';
    } else if (upstreamStatus === 401 || upstreamStatus === 403) {
      status = 503;
      code = 'AI_AUTH_FAILED';
    } else if (upstreamStatus === 400 && /API_KEY_INVALID|API key not valid/i.test(error.message || '')) {
      status = 503;
      code = 'AI_AUTH_FAILED';
    } else if (upstreamStatus === 404) {
      status = 503;
      code = 'AI_MODEL_UNAVAILABLE';
    } else if ([500, 502, 503, 504].includes(upstreamStatus)) {
      status = 503;
      code = 'AI_PROVIDER_UNAVAILABLE';
      errorMessage = 'Gemini is temporarily unavailable. Please try again in a moment.';
      res.set?.('Retry-After', '10');
    } else if (upstreamStatus === 429) {
      status = 429;
      code = 'AI_RATE_LIMITED';
      errorMessage = 'AI is busy. Please try again shortly.';
    }
    logAi('request_failed', {
      requestId, code, stage, model: GEMINI_MODEL,
      durationMs: Date.now() - started, ...errorDetails(error),
    }, true);
    return res.status(status).json({success: false, code, requestId, message: errorMessage});
  }
}
module.exports = {chatWithGemini};
