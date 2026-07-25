const glmClient = require('./glmClient');

function writeSSE(res, event, data) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (typeof res.flush === 'function') res.flush();
}

function chunkText(text, wordsPerChunk = 3) {
    const tokens = String(text || '').split(/(\s+)/); // split keeps whitespace tokens so re-joined chunks are exact
    const chunks = [];
    let buffer = '';
    let wordCount = 0;
    for (const token of tokens) {
        buffer += token;
        if (token.trim() !== '') wordCount += 1;
        if (wordCount >= wordsPerChunk) {
            chunks.push(buffer);
            buffer = '';
            wordCount = 0;
        }
    }
    if (buffer) chunks.push(buffer);
    return chunks;
}

class GLMStreamClient {
    initSSE(res) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no'
        });
        if (typeof res.flushHeaders === 'function') res.flushHeaders();
    }

    /**
     * Catalyst's QuickML GLM endpoint returns one full completion, not
     * token-by-token deltas (see glmClient.js). This calls it normally, then
     * simulates a streaming feel by writing the completed text to the client
     * as small word-group SSE `delta` events with a short stagger, giving a
     * ChatGPT-style typewriter UX without a token-streaming upstream model.
     * If Catalyst ever exposes true streaming, only this method's internals
     * need to change — callers/consumers keep working unmodified.
     */
    async streamCompletion(res, messages, options = {}) {
        const result = await glmClient.generate(messages, options);
        const fullText = result.content;

        for (const chunk of chunkText(fullText, 3)) {
            if (res.writableEnded || res.destroyed) break; // client hit "Stop Generation" / disconnected
            writeSSE(res, 'delta', { text: chunk });
            await new Promise((resolve) => setTimeout(resolve, 18));
        }

        return fullText;
    }

    async streamText(res, fullText) {
        for (const chunk of chunkText(fullText, 3)) {
            if (res.writableEnded || res.destroyed) break;
            writeSSE(res, 'delta', { text: chunk });
            await new Promise((resolve) => setTimeout(resolve, 18));
        }
        return fullText;
    }

    sendEvent(res, event, data) {
        writeSSE(res, event, data);
    }

    endStream(res) {
        res.end();
    }
}

module.exports = new GLMStreamClient();
