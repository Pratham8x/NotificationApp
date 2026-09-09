const {generateAnswer} = require('../services/geminiService');
const {getContext} = require('../services/aiContextService');
async function chatWithGemini(req, res) {
  const {message, history = []} = req.body || {};
  if (typeof message !== 'string' || !message.trim() || message.length > 2000) {
    return res.status(400).json({success: false, message: 'message must be a non-empty string of at most 2000 characters'});
  }
  if (!Array.isArray(history) || history.length > 10 || history.some((item, i) =>
    !item || item.role !== (i % 2 === 0 ? 'user' : 'model') || typeof item.text !== 'string' || !item.text.trim() || item.text.length > 8000) || history.length % 2 !== 0) {
    return res.status(400).json({success: false, message: 'Invalid conversation history'});
  }
  try {
    const context = await getContext(message.trim());
    const answer = await generateAnswer(message.trim(), context, history);
    return res.json({success: true, answer});
  } catch (error) {
    // Never log SDK errors, prompts or credentials.
    const status = error.code === 'AI_NOT_CONFIGURED' ? 503 : Number(error.status) === 429 ? 429 : 502;
    return res.status(status).json({success: false, message: status === 429
      ? 'AI is busy. Please try again shortly.' : 'AI is temporarily unavailable. Please try again later.'});
  }
}
module.exports = {chatWithGemini};
