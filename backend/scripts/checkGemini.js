// Run from any directory: node backend/scripts/checkGemini.js
require('dotenv').config({path: require('node:path').join(__dirname, '../.env'), quiet: true});
const {generateAnswer, GEMINI_MODEL} = require('../services/geminiService');
const {configuration, errorDetails, logAi} = require('../services/aiDiagnostics');
async function main() {
  logAi('local_check_started', {model: GEMINI_MODEL, ...configuration()});
  try {
    await generateAnswer('Reply with OK.');
    logAi('local_check_passed', {model: GEMINI_MODEL});
  } catch (error) {
    logAi('local_check_failed', {model: GEMINI_MODEL, ...errorDetails(error)}, true);
    process.exitCode = 1;
  }
}
main();
