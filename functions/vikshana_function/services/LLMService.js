const glmClient = require('./glmClient');
const geminiClient = require('./geminiClient');
const glmStreamClient = require('./glmStreamClient');
const geminiStreamClient = require('./geminiStreamClient');

class LLMService {
    /**
     * Unified generate function that attempts Catalyst GLM first,
     * then falls back to Gemini if it fails.
     */
    async generate(messages, options = {}) {
        const startTime = Date.now();
        const promptLength = JSON.stringify(messages).length;
        console.log(`[TELEMETRY] generate() | Prompt length: ${promptLength} chars`);
        
        try {
            console.log("[LLMService] Attempting to generate using Primary Provider (Catalyst GLM)...");
            const res = await glmClient.generate(messages, options);
            console.log(`[TELEMETRY] generate() | GLM Success | Response time: ${Date.now() - startTime}ms`);
            return res;
        } catch (glmError) {
            console.warn(`[TELEMETRY] generate() | GLM Failed | Reason: ${glmError.message}`);
            console.warn("[LLMService] GLM generation failed. Attempting Fallback Provider (Gemini):", glmError.message);
            try {
                const res = await geminiClient.generate(messages, options);
                console.log(`[TELEMETRY] generate() | Gemini Success | Response time: ${Date.now() - startTime}ms`);
                return res;
            } catch (geminiError) {
                console.error(`[TELEMETRY] generate() | Gemini Failed | Reason: ${geminiError.message}`);
                console.error("[LLMService] Both GLM and Gemini generations failed.");
                throw new Error("ALL_LLMS_FAILED");
            }
        }
    }

    /**
     * Unified streaming completion.
     */
    async streamCompletion(res, messages, options = {}) {
        const startTime = Date.now();
        const promptLength = JSON.stringify(messages).length;
        console.log(`[TELEMETRY] streamCompletion() | Prompt length: ${promptLength} chars`);
        
        try {
            console.log("[LLMService] Attempting streamCompletion using Primary Provider (Catalyst GLM)...");
            const result = await glmStreamClient.streamCompletion(res, messages, options);
            console.log(`[TELEMETRY] streamCompletion() | GLM Success | Response time: ${Date.now() - startTime}ms`);
            return result;
        } catch (glmError) {
            console.warn(`[TELEMETRY] streamCompletion() | GLM Failed | Reason: ${glmError.message}`);
            console.warn("[LLMService] GLM streamCompletion failed. Attempting Fallback Provider (Gemini):", glmError.message);
            try {
                const result = await geminiStreamClient.streamCompletion(res, messages, options);
                console.log(`[TELEMETRY] streamCompletion() | Gemini Success | Response time: ${Date.now() - startTime}ms`);
                return result;
            } catch (geminiError) {
                console.error(`[TELEMETRY] streamCompletion() | Gemini Failed | Reason: ${geminiError.message}`);
                console.error("[LLMService] Both GLM and Gemini streaming failed.");
                throw new Error("ALL_LLMS_FAILED");
            }
        }
    }

    initSSE(res) {
        glmStreamClient.initSSE(res);
    }

    sendEvent(res, event, data) {
        glmStreamClient.sendEvent(res, event, data);
    }

    endStream(res) {
        glmStreamClient.endStream(res);
    }
}

module.exports = new LLMService();
