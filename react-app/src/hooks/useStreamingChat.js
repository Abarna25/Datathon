import { useCallback, useRef, useState } from 'react';
import { API_BASE_URL } from '../services/api';

/**
 * Consumes the SSE stream from POST /conversations/:id/messages via raw
 * `fetch` + ReadableStream with fallback for JSON responses.
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
        if (!content || !content.trim()) return;
        const resolvedId = explicitConversationId || conversationId || `CONV-${Date.now()}`;
        lastUserMessageRef.current = content;

        setIsStreaming(true);
        setStreamedText('');
        setCitations([]);
        setSuggestions([]);
        setError(null);

        // 1. Immediately append user message to UI so it displays right away
        const userMsg = {
            role: 'user',
            content: content.trim(),
            id: `usr-${Date.now()}`,
            createdAt: new Date().toISOString()
        };
        if (onUserMessage) {
            onUserMessage(userMsg);
        }

        const controller = new AbortController();
        abortRef.current = controller;

        let accumulatedText = '';
        let finalCitations = [];
        let finalSuggestions = [];
        let assistantCommitted = false;

        try {
            const token = localStorage.getItem('vikshana_auth_token') || '';
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['X-Vikshana-Auth'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/conversations/${resolvedId}/messages`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    content: content.trim(),
                    officerId: officerId || 'System',
                    caseId: caseId || 'global'
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                let errMsg = `Request failed with status ${response.status}`;
                try {
                    const errJson = await response.json();
                    if (errJson.error || errJson.message) errMsg = errJson.error || errJson.message;
                } catch (_) {}
                throw new Error(errMsg);
            }

            const contentType = response.headers.get('content-type') || '';
            
            // Handle standard JSON response fallback
            if (contentType.includes('application/json')) {
                const json = await response.json();
                const assistantMsg = json.data?.assistantMessage || json.assistantMessage || json.data;
                const assistantText = assistantMsg?.content || (typeof assistantMsg === 'string' ? assistantMsg : 'Investigation analysis complete.');
                const citationsList = assistantMsg?.citations || [];
                const suggestionsList = assistantMsg?.suggestions || [];

                setIsStreaming(false);
                setStreamedText('');
                assistantCommitted = true;
                if (onAssistantMessage) {
                    onAssistantMessage({
                        role: 'assistant',
                        content: assistantText,
                        citations: citationsList,
                        suggestions: suggestionsList,
                        id: assistantMsg?.id || `msg-${Date.now()}`,
                        createdAt: new Date().toISOString()
                    });
                }
                return;
            }

            // Handle SSE Streaming response
            if (!response.body) {
                throw new Error('Response body is empty');
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
                            if (payload.text) {
                                accumulatedText += payload.text;
                                setStreamedText(accumulatedText);
                            }
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
                            setIsStreaming(false);
                            setStreamedText('');
                            assistantCommitted = true;
                            if (onAssistantMessage) {
                                onAssistantMessage({
                                    role: 'assistant',
                                    content: accumulatedText || 'Investigation report updated.',
                                    citations: finalCitations,
                                    suggestions: finalSuggestions,
                                    id: payload.messageId || `msg-${Date.now()}`,
                                    createdAt: new Date().toISOString()
                                });
                            }
                            break;
                        default:
                            break;
                    }
                }
            }

            // If stream completed without a 'done' event but with accumulated text
            if (!assistantCommitted && accumulatedText) {
                setIsStreaming(false);
                setStreamedText('');
                assistantCommitted = true;
                if (onAssistantMessage) {
                    onAssistantMessage({
                        role: 'assistant',
                        content: accumulatedText,
                        citations: finalCitations,
                        suggestions: finalSuggestions,
                        id: `msg-${Date.now()}`,
                        createdAt: new Date().toISOString()
                    });
                }
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.warn('[useStreamingChat] send failed:', err);
                setError(err.message);
                setIsStreaming(false);
                setStreamedText('');
                if (!assistantCommitted) {
                    assistantCommitted = true;
                    const fallbackReply = accumulatedText || 'I encountered a temporary disruption while analyzing this request. Please try again or check the system logs.';
                    if (onAssistantMessage) {
                        onAssistantMessage({
                            role: 'assistant',
                            content: fallbackReply,
                            citations: finalCitations,
                            suggestions: ['Summarize Case', 'Show Timeline', 'List Evidence'],
                            id: `fallback-${Date.now()}`,
                            createdAt: new Date().toISOString()
                        });
                    }
                }
            }
        } finally {
            setIsStreaming(false);
            setStreamedText('');
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

