const { createLiveToken, LIVE_MODEL } = require('../services/liveTokenService');

async function issueLiveToken(req, res) {
  try {
    const { token, expiresAt } = await createLiveToken();
    return res.json({ success: true, token, expiresAt, model: LIVE_MODEL });
  } catch (error) {
    const status = error.code === 'AI_NOT_CONFIGURED' ? 503 : 502;
    console.error('Gemini Live token request failed:', {
      code: error.code || 'LIVE_TOKEN_ERROR',
      status: Number(error.status) || undefined,
    });
    return res.status(status).json({
      success: false,
      code: error.code || 'LIVE_TOKEN_ERROR',
      message:
        status === 503
          ? 'AI voice service is not configured.'
          : 'Could not start AI voice conversation.',
    });
  }
}

module.exports = { issueLiveToken };
