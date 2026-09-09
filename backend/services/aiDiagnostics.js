function logAi(event, fields = {}, failed = false) {
  const line = JSON.stringify({scope: 'ai', version: 1, event, ...fields});
  if (failed) console.error(line);
  else console.info(line);
}

function configuration() {
  const key = process.env.GEMINI_API_KEY || '';
  return {
    keyPresent: Boolean(key.trim()),
    keyHasOuterWhitespace: key !== key.trim(),
    keyLooksQuoted: /^['"]|['"]$/.test(key.trim()),
    ragEnabled: process.env.AI_RAG_ENABLED === 'true',
  };
}

function errorDetails(error) {
  // Inspect provider messages only to match known categories. Never output them.
  const message = typeof error?.message === 'string' ? error.message : '';
  const status = Number(error?.status);
  const categories = [
    ['KEY_INVALID', /API_KEY_INVALID|API key not valid/i],
    ['KEY_REPORTED_LEAKED', /leaked/i],
    ['API_DISABLED', /SERVICE_DISABLED|API has not been used|is disabled/i],
    ['KEY_RESTRICTION', /API_KEY_SERVICE_BLOCKED|API_KEY_HTTP_REFERRER_BLOCKED|API_KEY_IP_ADDRESS_BLOCKED|referer.*blocked/i],
    ['BILLING_REQUIRED', /billing/i],
    ['QUOTA_EXCEEDED', /RESOURCE_EXHAUSTED|quota/i],
    ['MODEL_NOT_FOUND', /model.*not found|not supported for generateContent/i],
    ['REGION_UNSUPPORTED', /location is not supported|region.*not supported/i],
    ['TIMEOUT', /timeout|timed out|aborted/i],
    ['NETWORK_ERROR', /fetch failed|ENOTFOUND|ECONNRESET|ECONNREFUSED/i],
    ['ATLAS_INDEX_ERROR', /index.*not found|index.*not ready|index.*queryable|vectorSearch.*not allowed/i],
    ['EMPTY_RESPONSE', /AI returned no text/i],
  ];
  return {
    upstreamStatus: Number.isInteger(status) && status >= 100 && status <= 599 ? status : null,
    reason: categories.find(([, pattern]) => pattern.test(message))?.[0] || ({401: 'UNAUTHENTICATED', 403: 'PERMISSION_DENIED', 404: 'NOT_FOUND', 429: 'RATE_LIMITED'}[status] || 'UNCLASSIFIED'),
    networkCode: ['ENOTFOUND', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT'].includes(error?.cause?.code) ? error.cause.code : null,
  };
}

module.exports = {logAi, configuration, errorDetails};
