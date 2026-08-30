class StructuredAIResponseParser {
    /**
     * Parses and validates a raw AI response, handling truncation and malformed JSON.
     * @param {Object} responseMessage - The object returned by LLMService.generate()
     * @returns {Object} - Status object { status, data, rawContent }
     */
    static parse(responseMessage) {
        if (!responseMessage || !responseMessage.content) {
            return { status: 'EMPTY_RESPONSE', data: null, rawContent: '' };
        }

        const rawContent = responseMessage.content;
        const finishReason = responseMessage.finish_reason || 'stop';

        // 1. Detect Explicit Truncation
        if (finishReason === 'length' || finishReason === 'max_tokens') {
            console.warn("[StructuredAIResponseParser] LLM explicitly reported truncation via finish_reason:", finishReason);
            return { status: 'TRUNCATED_OUTPUT', data: null, rawContent };
        }

        // 2. Extract JSON payload
        let jsonStr = rawContent;
        const match = jsonStr.match(/\{[\s\S]*\}/);
        if (match) {
            jsonStr = match[0];
        } else {
            // No JSON object found
            return { status: 'MALFORMED_JSON', data: null, rawContent };
        }

        // Clean control characters that break JSON.parse
        jsonStr = jsonStr.replace(/[\x00-\x1F\x7F-\x9F]/g, "");

        // 3. Attempt Parsing
        let parsedData;
        try {
            parsedData = JSON.parse(jsonStr);
        } catch (error) {
            console.warn("[StructuredAIResponseParser] JSON parse failed, likely truncated implicitly.", error.message);
            // It could be implicit truncation if the model ran out of tokens but the provider didn't correctly report finish_reason
            return { status: 'TRUNCATED_OUTPUT', data: null, rawContent };
        }

        // 4. Validate Schema Basic
        if (typeof parsedData !== 'object' || Array.isArray(parsedData) || parsedData === null) {
            return { status: 'MALFORMED_JSON', data: null, rawContent };
        }

        return { status: 'VALID_JSON', data: parsedData, rawContent };
    }
}

module.exports = StructuredAIResponseParser;
