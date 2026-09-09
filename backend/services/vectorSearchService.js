const {EMBEDDING_DIMENSIONS} = require('./embeddingService');
// Model, index, path and filter are trusted server configuration, never request body values.
async function vectorSearch({model, queryVector, index = 'ai_knowledge_vector', path = 'embedding', limit = 4, filter, signal}) {
  if (!Array.isArray(queryVector) || queryVector.length !== EMBEDDING_DIMENSIONS || !queryVector.every(Number.isFinite)) {
    throw new Error('Invalid query vector');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error('Invalid search limit');
  signal?.throwIfAborted();
  return model.aggregate([
    {$vectorSearch: {index, path, queryVector, numCandidates: limit * 20, limit, ...(filter ? {filter} : {})}},
    {$project: {_id: 1, title: 1, content: 1, score: {$meta: 'vectorSearchScore'}}},
  ]).option({maxTimeMS: 5000, ...(signal ? {signal} : {})});
}
module.exports = {vectorSearch};
