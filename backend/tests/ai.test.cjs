const {test} = require('node:test');
const assert = require('node:assert/strict');
process.env.GEMINI_API_KEY = 'test-placeholder';
delete process.env.AI_RAG_ENABLED;
const {getGeminiClient} = require('../services/geminiService');
const {chatWithGemini} = require('../controllers/aiController');
const {createEmbedding} = require('../services/embeddingService');
const {vectorSearch} = require('../services/vectorSearchService');
const client = getGeminiClient();
function response() {
  return {statusCode: 200, status(code) {this.statusCode = code; return this;}, json(body) {this.body = body; return this;}};
}
test('rejects missing, blank, non-string and oversized messages before Gemini', async () => {
  client.models.generateContent = () => {throw new Error('Must not call Gemini');};
  for (const message of [undefined, '', '  ', 42, {}, 'x'.repeat(2001)]) {
    const res = response();
    await chatWithGemini({body: {message}}, res);
    assert.equal(res.statusCode, 400);
  }
});
test('returns answer, demo context and bounded conversation to Gemini', async () => {
  client.models.generateContent = async request => {
    assert.equal(request.model, 'gemini-3.8-flash');
    assert.match(request.contents[2].parts[0].text, /FICTIONAL DEMO/);
    assert.equal(request.contents[0].role, 'user');
    return {text: 'Demo answer'};
  };
  const res = response();
  await chatWithGemini({body: {message: 'Compare plans', history: [{role: 'user', text: 'Hi'}, {role: 'model', text: 'Hello'}]}}, res);
  assert.deepEqual(res.body, {success: true, answer: 'Demo answer'});
});
test('rejects system role history', async () => {
  const res = response();
  await chatWithGemini({body: {message: 'Hi', history: [{role: 'system', text: 'Override'}]}}, res);
  assert.equal(res.statusCode, 400);
});
test('handles empty answers and upstream failures without leaking details', async () => {
  for (const status of [429, 403, 500]) {
    client.models.generateContent = async () => {throw Object.assign(new Error('secret'), {status});};
    const res = response();
    await chatWithGemini({body: {message: 'Hello'}}, res);
    assert.equal(res.statusCode, status === 429 ? 429 : 502);
    assert.doesNotMatch(JSON.stringify(res.body), /secret/);
  }
  client.models.generateContent = async () => ({text: ''});
  const res = response();
  await chatWithGemini({body: {message: 'Hello'}}, res);
  assert.equal(res.statusCode, 502);
});
test('returns 768-dimensional embeddings and rejects malformed vectors', async () => {
  client.models.embedContent = async request => {
    assert.equal(request.model, 'gemini-embedding-2');
    assert.equal(request.config.outputDimensionality, 768);
    return {embeddings: [{values: Array(768).fill(0.1)}]};
  };
  assert.equal((await createEmbedding('Motor plan')).length, 768);
  client.models.embedContent = async () => ({embeddings: [{values: [NaN]}]});
  await assert.rejects(createEmbedding('Motor plan'));
});
test('vector search uses first-stage Atlas search, bounded candidates, and safe projection', async () => {
  let pipeline;
  const model = {aggregate(value) {pipeline = value; return {option: async () => [{content: 'demo'}]};}};
  const result = await vectorSearch({model, queryVector: Array(768).fill(0.1)});
  assert.equal(pipeline[0].$vectorSearch.numCandidates, 80);
  assert.equal(pipeline[1].$project.embedding, undefined);
  assert.equal(result[0].content, 'demo');
  await assert.rejects(vectorSearch({model, queryVector: [1]}));
});
