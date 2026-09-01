require('dotenv').config({ path: __dirname + '/.env' });
const LLMService = require('./services/LLMService');
const HealthService = require('./services/HealthService');
const QuickMLService = require('./services/QuickMLService');

async function runTests() {
    console.log("=== RUNNING PROBE AI TESTS ===\n");
    
    console.log("1. Checking Health API...");
    const health = await HealthService.getSystemHealth({});
    console.log(JSON.stringify(health.ai, null, 2));

    console.log("\n2. Testing LLMService (Circuit Breaker & Fallback)...");
    try {
        const result = await LLMService.generate([{ role: 'user', content: 'Say hello exactly.' }]);
        console.log("LLM Success:", result.content);
    } catch (e) {
        console.error("LLM Failed:", e.message);
        console.error(e.details);
    }

    console.log("\n3. Testing Translation Pipeline...");
    try {
        const translated = await QuickMLService.translateText({}, { texts: ['Hello world'], sourceLanguage: 'en', targetLanguage: 'kn' });
        console.log("Translation Result:", translated);
    } catch (e) {
        console.error("Translation Failed:", e.code || e.message);
    }

    console.log("\n=== PROBE COMPLETE ===");
}

runTests();
