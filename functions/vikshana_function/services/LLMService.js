const glmClient = require('./glmClient');
const QuickMLRAGClient = require('./QuickMLRAGClient');
const geminiClient = require('./geminiClient');
const glmStreamClient = require('./glmStreamClient');
const geminiStreamClient = require('./geminiStreamClient');

const CIRCUIT_BREAKER_TIMEOUT = 5 * 60 * 1000; // 5 minutes

class LLMService {
    constructor() {
        this.providerHealth = {
            rag: { status: 'HEALTHY', nextRetry: 0, lastError: null },
            glm: { status: 'HEALTHY', nextRetry: 0, lastError: null },
            gemini: { status: 'HEALTHY', nextRetry: 0, lastError: null }
        };
    }

    checkHealth(providerName) {
        const health = this.providerHealth[providerName];
        if (health.status === 'UNHEALTHY' && Date.now() < health.nextRetry) {
            return false;
        }
        if (health.status === 'UNHEALTHY' && Date.now() >= health.nextRetry) {
            // Recover
            health.status = 'HEALTHY';
        }
        return true;
    }

    markUnhealthy(providerName, error) {
        // Only mark unhealthy if it's a permanent error (400, 401, 403, 404, or explicit "Permanent error" message)
        const isPermanent = error.message && (error.message.includes('Permanent error') || error.message.includes('Authentication') || error.message.includes('401') || error.message.includes('403') || error.message.includes('404') || error.message.includes('not configured'));
        if (isPermanent) {
            this.providerHealth[providerName] = {
                status: 'UNHEALTHY',
                nextRetry: Date.now() + CIRCUIT_BREAKER_TIMEOUT,
                lastError: error.message
            };
            console.warn(`[LLMService] Circuit Breaker: Marking ${providerName} as UNHEALTHY due to permanent error: ${error.message}`);
        }
    }

    async generate(messages, options = {}) {
        const startTime = Date.now();
        const promptLength = JSON.stringify(messages).length;
        console.log(`[TELEMETRY] generate() | Prompt length: ${promptLength} chars`);
        
        const errors = [];

        // 1. Try RAG
        if (process.env.QUICKML_RAG_ENDPOINT) {
            if (this.checkHealth('rag')) {
                try {
                    console.log("[LLMService] Attempting to generate using Primary RAG Provider (QuickML GLM-4.7-Flash)...");
                    const res = await QuickMLRAGClient.generate(messages, options);
                    console.log(`[TELEMETRY] generate() | QuickML RAG Success | Response time: ${Date.now() - startTime}ms`);
                    return res;
                } catch (ragError) {
                    this.markUnhealthy('rag', ragError);
                    console.warn(`[TELEMETRY] generate() | QuickML RAG Failed | Reason: ${ragError.message}`);
                    errors.push(`RAG: ${ragError.message}`);
                }
            } else {
                errors.push(`RAG: UNHEALTHY (${this.providerHealth.rag.lastError})`);
            }
        } else {
             errors.push('RAG: NOT_CONFIGURED');
        }

        // 2. Try GLM
        if (this.checkHealth('glm')) {
            try {
                console.log("[LLMService] Attempting Fallback Provider (Catalyst GLM)...");
                const res = await glmClient.generate(messages, options);
                console.log(`[TELEMETRY] generate() | GLM Success | Response time: ${Date.now() - startTime}ms`);
                return res;
            } catch (glmError) {
                this.markUnhealthy('glm', glmError);
                console.warn(`[TELEMETRY] generate() | GLM Failed | Reason: ${glmError.message}`);
                errors.push(`GLM: ${glmError.message}`);
            }
        } else {
            errors.push(`GLM: UNHEALTHY (${this.providerHealth.glm.lastError})`);
        }

        // 3. Try Gemini
        if (this.checkHealth('gemini')) {
            try {
                console.log("[LLMService] Attempting Fallback Provider (Gemini)...");
                const res = await geminiClient.generate(messages, options);
                console.log(`[TELEMETRY] generate() | Gemini Success | Response time: ${Date.now() - startTime}ms`);
                return res;
            } catch (geminiError) {
                this.markUnhealthy('gemini', geminiError);
                console.warn(`[TELEMETRY] generate() | Gemini Failed | Reason: ${geminiError.message}`);
                errors.push(`Gemini: ${geminiError.message}`);
            }
        } else {
             errors.push(`Gemini: UNHEALTHY (${this.providerHealth.gemini.lastError})`);
        }

        console.error("[LLMService] ALL_PROVIDERS_FAILED:\n" + errors.join('\n'));
        const err = new Error("ALL_LLMS_FAILED");
        err.details = errors;
        throw err;
    }

    async streamCompletion(res, messages, options = {}) {
        const startTime = Date.now();
        const promptLength = JSON.stringify(messages).length;
        console.log(`[TELEMETRY] streamCompletion() | Prompt length: ${promptLength} chars`);
        
        const errors = [];

        // 1. Try RAG
        if (process.env.QUICKML_RAG_ENDPOINT) {
            if (this.checkHealth('rag')) {
                try {
                    console.log("[LLMService] Attempting streamCompletion using Primary RAG Provider (QuickML GLM-4.7-Flash)...");
                    const result = await QuickMLRAGClient.generate(messages, options);
                    this.sendEvent(res, 'content', { delta: result.content });
                    console.log(`[TELEMETRY] streamCompletion() | QuickML RAG Success | Response time: ${Date.now() - startTime}ms`);
                    return result.content;
                } catch (ragError) {
                    this.markUnhealthy('rag', ragError);
                    console.warn(`[TELEMETRY] streamCompletion() | QuickML RAG Failed | Reason: ${ragError.message}`);
                    errors.push(`RAG: ${ragError.message}`);
                }
            } else {
                errors.push(`RAG: UNHEALTHY (${this.providerHealth.rag.lastError})`);
            }
        } else {
            errors.push('RAG: NOT_CONFIGURED');
        }

        // 2. Try GLM
        if (this.checkHealth('glm')) {
            try {
                console.log("[LLMService] Attempting streamCompletion using Fallback Provider (Catalyst GLM)...");
                const result = await glmStreamClient.streamCompletion(res, messages, options);
                console.log(`[TELEMETRY] streamCompletion() | GLM Success | Response time: ${Date.now() - startTime}ms`);
                return result;
            } catch (glmError) {
                this.markUnhealthy('glm', glmError);
                console.warn(`[TELEMETRY] streamCompletion() | GLM Failed | Reason: ${glmError.message}`);
                errors.push(`GLM: ${glmError.message}`);
            }
        } else {
             errors.push(`GLM: UNHEALTHY (${this.providerHealth.glm.lastError})`);
        }

        // 3. Try Gemini
        if (this.checkHealth('gemini')) {
            try {
                console.log("[LLMService] Attempting streamCompletion using Fallback Provider (Gemini)...");
                const result = await geminiStreamClient.streamCompletion(res, messages, options);
                console.log(`[TELEMETRY] streamCompletion() | Gemini Success | Response time: ${Date.now() - startTime}ms`);
                return result;
            } catch (geminiError) {
                this.markUnhealthy('gemini', geminiError);
                console.warn(`[TELEMETRY] streamCompletion() | Gemini Failed | Reason: ${geminiError.message}`);
                errors.push(`Gemini: ${geminiError.message}`);
            }
        } else {
            errors.push(`Gemini: UNHEALTHY (${this.providerHealth.gemini.lastError})`);
        }

        console.error("[LLMService] ALL_PROVIDERS_FAILED (Stream):\n" + errors.join('\n'));
        const err = new Error("ALL_LLMS_FAILED");
        err.details = errors;
        throw err;
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
