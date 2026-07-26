const geminiClient = require('./geminiClient');

function writeSSE(res, event, data) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (typeof res.flush === 'function') res.flush();
}

function chunkText(text, wordsPerChunk = 3) {
    const tokens = String(text || '').split(/(\s+)/);
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

class GeminiStreamClient {
    initSSE(res) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no'
        });
        if (typeof res.flushHeaders === 'function') res.flushHeaders();
    }

    async streamCompletion(res, messages, options = {}) {
        let fullText = "";
        try {
            // Check if client is configured
            if (!geminiClient.apiKey) {
                const offlineResult = await geminiClient.generate(messages, options);
                return await this.streamText(res, offlineResult.content);
            }

            const responseStream = await geminiClient.stream(messages, options);
            
            for await (const chunk of responseStream) {
                if (res.writableEnded || res.destroyed) break;
                
                const textChunk = chunk.text;
                if (textChunk) {
                    fullText += textChunk;
                    writeSSE(res, 'delta', { text: textChunk });
                }
            }
        } catch (err) {
            console.error('[GeminiStreamClient] Streaming error:', err);
            // Re-throw to be handled by caller
            throw err;
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

module.exports = new GeminiStreamClient();
