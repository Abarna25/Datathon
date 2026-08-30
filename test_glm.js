require('dotenv').config({ path: './.env' });
const glmClient = require('./functions/vikshana_function/services/glmClient');

async function testGLM() {
    console.log("Starting GLM Test...");
    try {
        const messages = [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: "What's the weather like in Paris today?" }
        ];

        // Ensure the token is set (it will try to use the one from .env)
        console.log("Using Endpoint:", glmClient.endpoint);
        console.log("Using Model:", glmClient.model);

        const response = await glmClient.generate(messages, {
            temperature: 0.7,
            maxTokens: 500
        });

        console.log("\n✅ GLM Response Received:\n");
        console.log(response.content);

    } catch (error) {
        console.error("\n❌ GLM Test Failed:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        }
    }
}

testGLM();
