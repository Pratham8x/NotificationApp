const demoKnowledge = require('../data/aiKnowledge');
const AiKnowledge = require('../models/AiKnowledge');
const {createEmbedding} = require('./embeddingService');
const {vectorSearch} = require('./vectorSearchService');
async function getContext(message, signal) {
  const documents = process.env.AI_RAG_ENABLED === 'true'
    ? await vectorSearch({model: AiKnowledge, queryVector: await createEmbedding(message, signal), signal})
    : demoKnowledge;
  return documents.map(doc => `${doc.title}: ${doc.content}`).join('\n\n').slice(0, 16000);
}
module.exports = {getContext};
