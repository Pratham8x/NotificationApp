const { GoogleGenAI } = require('@google/genai');

const LIVE_MODEL =
  process.env.GEMINI_LIVE_MODEL?.trim() || 'gemini-3.1-flash-live-preview';

async function createLiveToken() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    const error = new Error('AI service is not configured');
    error.code = 'AI_NOT_CONFIGURED';
    throw error;
  }

  const now = Date.now();
  const expiresAt = new Date(now + 30 * 60 * 1000).toISOString();
  const newSessionExpiresAt = new Date(now + 60 * 1000).toISOString();
  const client = new GoogleGenAI({ apiKey });
  const token = await client.authTokens.create({
    config: {
      uses: 1,
      expireTime: expiresAt,
      newSessionExpireTime: newSessionExpiresAt,
      liveConnectConstraints: {
        model: LIVE_MODEL,
        config: {
          responseModalities: ['AUDIO'],
          sessionResumption: {},
          systemInstruction: {
            parts: [
              {
                text: 'You are Chirpy AI, a helpful insurance information assistant. Give concise spoken answers. Use only information you know or receive from tools. Clearly identify demo products as fictional and never promise coverage, quotes, or claim outcomes.',
              },
            ],
          },
        },
      },
    },
  });

  if (!token?.name) throw new Error('Gemini did not return an ephemeral token');
  return { token: token.name, expiresAt };
}

module.exports = { createLiveToken, LIVE_MODEL };
