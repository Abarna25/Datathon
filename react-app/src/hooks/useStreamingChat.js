import { useCallback, useRef, useState } from 'react';
import { API_BASE_URL } from '../services/api';

/**
 * Consumes the SSE stream from POST /conversations/:id/messages via raw
 * `fetch` + ReadableStream (axios cannot stream in the browser — see
 * services/conversationService.js for the non-streaming axios paths).
 * The backend simulates streaming (glmStreamClient.js) by chunking a
 * completed GLM response into `delta` events, followed by `citations`,
 * `suggestions`, and `done`.
 */
export function useStreamingChat({ conversationId, officerId, caseId, onUserMessage, onAssistantMessage }) {
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamedText, setStreamedText] = useState('');
    const [citations, setCitations] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [error, setError] = useState(null);
    const abortRef = useRef(null);
    const lastUserMessageRef = useRef(null);

    const send = useCallback(async (content, explicitConversationId) => {
        const resolvedId = explicitConversationId || conversationId;
        if (!resolvedId || !content || !content.trim()) return;
        lastUserMessageRef.current = content;

        setIsStreaming(true);
        setStreamedText('');
        setCitations([]);
        setSuggestions([]);
        setError(null);

        if (onUserMessage) {
            onUserMessage({ role: 'user', content, id: `local-${Date.now()}` });
        }

        const controller = new AbortController();
        abortRef.current = controller;

        let accumulatedText = '';
        let finalCitations = [];
        let finalSuggestions = [];

        try {
            const response = await fetch(`${API_BASE_URL}/conversations/${resolvedId}/messages`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Vikshana-Auth': `Bearer ${localStorage.getItem('vikshana_auth_token') || ''}`
                },
                body: JSON.stringify({ content, officerId, caseId }),
                signal: controller.signal
            });

            if (!response.ok || !response.body) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                let boundary = buffer.indexOf('\n\n');
                while (boundary !== -1) {
                    const rawEvent = buffer.slice(0, boundary);
                    buffer = buffer.slice(boundary + 2);
                    boundary = buffer.indexOf('\n\n');

                    const eventMatch = rawEvent.match(/^event: (.+)$/m);
                    const dataMatch = rawEvent.match(/^data: (.+)$/m);
                    if (!eventMatch || !dataMatch) continue;

                    let payload;
                    try {
                        payload = JSON.parse(dataMatch[1]);
                    } catch {
                        continue;
                    }

                    switch (eventMatch[1].trim()) {
                        case 'delta':
                            accumulatedText += payload.text;
                            setStreamedText(accumulatedText);
                            break;
                        case 'citations':
                            finalCitations = payload.citations || [];
                            setCitations(finalCitations);
                            break;
                        case 'suggestions':
                            finalSuggestions = payload.suggestions || [];
                            setSuggestions(finalSuggestions);
                            break;
                        case 'error':
                            throw new Error(payload.message || 'Streaming error');
                        case 'done':
                            // Flip isStreaming here (not just in `finally`) so the transient
                            // streaming bubble and the finalized message from `messages`
                            // never both render in the same frame.
                            setIsStreaming(false);
                            if (onAssistantMessage) {
                                onAssistantMessage({
                                    role: 'assistant',
                                    content: accumulatedText,
                                    citations: finalCitations,
                                    suggestions: finalSuggestions,
                                    id: payload.messageId
                                });
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.debug('[useStreamingChat] send failed:', err);
                setError(err.message);
                if (onAssistantMessage && accumulatedText) {
                    // Partial answer survives a mid-stream failure instead of vanishing.
                    onAssistantMessage({ role: 'assistant', content: accumulatedText, citations: finalCitations, suggestions: [] });
                }
            }
        } finally {
            setIsStreaming(false);
            abortRef.current = null;
        }
    }, [conversationId, officerId, caseId, onUserMessage, onAssistantMessage]);

    const stopGeneration = useCallback(() => {
        if (abortRef.current) abortRef.current.abort();
    }, []);

    const regenerate = useCallback(() => {
        if (lastUserMessageRef.current) send(lastUserMessageRef.current, conversationId);
    }, [send, conversationId]);

    return { send, stopGeneration, regenerate, isStreaming, streamedText, citations, suggestions, error };
}
