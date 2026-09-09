Gemini chat is integrated into the existing backend and app.

From backend/, install if needed (both dependencies already exist):

```sh
npm install @google/genai dotenv
```

Keep the real key only in backend/.env, which is ignored by Git:

```dotenv
GEMINI_API_KEY=your_key_here
AI_RAG_ENABLED=false
```

Run `npm start` from backend/. The existing index.js loads dotenv before routes.
No key belongs in React Native. The app uses the existing authenticated Axios client.

New backend files:
- services/geminiService.js: lazy GoogleGenAI initialization, timeout and text generation.
- controllers/aiController.js: message/history validation and safe error responses.
- routes/aiRoutes.js: authenticated POST /chat, 10 requests/minute/user and one active request/user per process. Configure shared gateway limits for multiple replicas.
- data/aiKnowledge.js: fictional demo plans, claims workflow and support details included in each prompt by default.
- services/embeddingService.js: createEmbedding(text), Gemini Embedding 2, 768 dimensions.
- services/vectorSearchService.js: reusable Mongoose $vectorSearch aggregation.
- models/AiKnowledge.js: future public knowledge collection.
- services/aiContextService.js: chooses demo context or Atlas retrieval.

Existing backend/index.js additions:

```js
const aiRoutes = require('./routes/aiRoutes');
app.use('/api/ai', aiRoutes);
```

POST /api/ai/chat requires the existing Authorization: Bearer <session token> header.

```json
{"message":"Compare the demo motor insurance plans"}
```

Successful response:

```json
{"success":true,"answer":"Gemini answer here"}
```

Optional history is an array of alternating {role: 'user'|'model', text: '...'} pairs, limited to 10 entries. No conversation database storage is added. AI messages last while the screen is open.

Frontend additions: src/screens/AiChatScreen.jsx; an AiChat stack route in src/navigation/AppNavigator.js; a Chirpy AI header row above users in src/screens/HomeScreen.jsx. Includes pending state, request cancellation, and retryable error feedback.

Future Atlas RAG setup:
1. Use the existing connected Mongoose database to ingest approved public knowledge. For example, from a trusted backend script after dotenv and connectDB:

```js
const AiKnowledge = require('./models/AiKnowledge');
const {createEmbedding} = require('./services/embeddingService');
const documents = require('./data/aiKnowledge');
for (const document of documents) {
  const embedding = await createEmbedding(`${document.title}: ${document.content}`);
  await AiKnowledge.updateOne(
    {title: document.title},
    {$set: {...document, embedding, embeddingModel: 'gemini-embedding-2'}},
    {upsert: true, runValidators: true},
  );
}
```

2. Create an Atlas Vector Search index named ai_knowledge_vector on ai_knowledge. A regular Mongoose index does not create this:

```json
{
  "fields": [
    {"type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine"}
  ]
}
```

3. Wait until the index is queryable, set AI_RAG_ENABLED=true, and restart the backend. Requests then embed the question, retrieve up to four documents, and send context plus the question to Gemini. An unavailable index returns a safe error instead of silently using demo content. Re-embed all documents when changing embedding models or dimensions. The collection is for shared public knowledge; private data requires server-side authorization filters and matching Atlas filter fields.

Models verified against official documentation:
- https://ai.google.dev/gemini-api/docs/models (gemini-3.1-flash-lite)
- https://ai.google.dev/gemini-api/docs/embeddings (gemini-embedding-2)

Verification: `node --test backend/tests/ai.test.cjs` uses SDK mocks and makes no paid API calls. Live Gemini credentials, Atlas indexing and device interaction require an integration smoke test in your environment.

Railway troubleshooting:
Set GEMINI_API_KEY in the Railway backend service Variables, not only in your local .env, then redeploy. A Google 401/403 or API_KEY_INVALID now returns AI_AUTH_FAILED (503); verify the key and its API restrictions in the Google project. AI_MODEL_UNAVAILABLE means the selected model is unavailable (Google 404). AI_RATE_LIMITED means quota/rate limits (429). Logs contain only code, stage and upstream HTTP status. Keep AI_RAG_ENABLED=false until Atlas ingestion and indexing are complete.

Simple endpoint troubleshooting:
- Route: backend/routes/aiRoutes.js (POST /chat).
- Handler: backend/controllers/aiController.js (chatWithGemini).
- Gemini call: backend/services/geminiService.js (generateAnswer).
- Mount: backend/index.js (app.use('/api/ai', aiRoutes)).
- Run `node backend/scripts/checkGemini.js` from the project root to test the backend key directly without MongoDB, login or React Native. This makes one small Gemini request and prints only safe diagnostic metadata.
- GEMINI_MODEL optionally overrides the default model using a model available to your Google project.
- Logging is limited to startup, chat start, and success/failure. Failures include a request ID, stage and provider status. No chat text or API keys are logged.
