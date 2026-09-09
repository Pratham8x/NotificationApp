const {getGeminiClient} = require('./geminiService');
const EMBEDDING_MODEL = 'gemini-embedding-2';
const EMBEDDING_DIMENSIONS = 768;
async function createEmbedding(text, signal) {
  if (typeof text !== 'string' || !text.trim() || text.length > 12000) {
    throw new Error('Embedding text must contain 1 to 12000 characters');
  }
  const response = await getGeminiClient().models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text.trim(),
    config: {abortSignal: signal, outputDimensionality: EMBEDDING_DIMENSIONS},
  });
  const vector = response.embeddings?.[0]?.values;
  if (!Array.isArray(vector) || vector.length !== EMBEDDING_DIMENSIONS || !vector.every(Number.isFinite)) {
    throw new Error('Invalid embedding returned');
  }
  return vector;
}
module.exports = {createEmbedding, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS};
