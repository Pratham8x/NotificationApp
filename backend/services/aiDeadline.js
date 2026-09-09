// Race the entire operation, not each individual API request or retry.
async function withAiDeadline(work, timeoutMs = 30000) {
  const controller = new AbortController();
  let timer;
  const deadline = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      const error = Object.assign(new Error('AI request timed out'), {code: 'AI_TIMEOUT'});
      reject(error);
      controller.abort(error);
    }, timeoutMs);
  });
  try {
    return await Promise.race([Promise.resolve().then(() => work(controller.signal)), deadline]);
  } finally {
    clearTimeout(timer);
  }
}
module.exports = {withAiDeadline};
