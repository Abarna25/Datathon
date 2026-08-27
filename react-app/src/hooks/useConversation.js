import { useCallback, useEffect, useState } from 'react';
import * as conversationService from '../services/conversationService';

/** Owns the conversation list + active conversation's message array for a given case. */
export function useConversation({ caseId, officerId }) {
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    const refreshConversations = useCallback(async () => {
        try {
            const list = await conversationService.listConversations(caseId || 'global', officerId || 'System');
            const validList = Array.isArray(list) ? list : [];
            setConversations(validList);
            return validList;
        } catch (e) {
            return [];
        }
    }, [caseId, officerId]);

    const selectConversation = useCallback(async (id) => {
        if (!id) return;
        setActiveConversationId(id);
        setLoading(true);
        try {
            const convo = await conversationService.getConversation(id);
            if (convo && Array.isArray(convo.messages)) {
                setMessages(convo.messages);
            }
        } catch (err) {
            console.warn('[selectConversation] error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const startNewConversation = useCallback(async () => {
        try {
            const convo = await conversationService.createConversation(caseId || 'global', officerId || 'System');
            const validConvo = (convo && convo.id) ? convo : {
                id: `CONV-${Date.now()}`,
                caseId: caseId || 'global',
                officerId: officerId || 'System',
                title: 'New Investigation Chat',
                messages: []
            };
            setConversations((prev) => [validConvo, ...prev.filter(c => c.id !== validConvo.id)]);
            setActiveConversationId(validConvo.id);
            setMessages([]);
            return validConvo;
        } catch (err) {
            const fallback = {
                id: `CONV-${Date.now()}`,
                caseId: caseId || 'global',
                officerId: officerId || 'System',
                title: 'New Investigation Chat',
                messages: []
            };
            setConversations((prev) => [fallback, ...prev]);
            setActiveConversationId(fallback.id);
            setMessages([]);
            return fallback;
        }
    }, [caseId, officerId]);

    const renameConversation = useCallback(async (id, title) => {
        const updated = await conversationService.updateConversation(id, { title });
        setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    }, []);

    const toggleBookmark = useCallback(async (id, isBookmarked) => {
        const updated = await conversationService.updateConversation(id, { isBookmarked });
        setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    }, []);

    const archiveConversation = useCallback(async (id, isArchived = true) => {
        const updated = await conversationService.updateConversation(id, { isArchived });
        setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    }, []);

    const removeConversation = useCallback(async (id) => {
        await conversationService.deleteConversation(id);
        setConversations((prev) => prev.filter((c) => c.id !== id));
        setActiveConversationId((current) => {
            if (current === id) {
                setMessages([]);
                return null;
            }
            return current;
        });
    }, []);

    const appendMessage = useCallback((message) => {
        if (!message) return;
        setMessages((prev) => {
            // Deduplicate if message with identical id already exists
            if (message.id && prev.some((m) => m.id === message.id)) {
                return prev.map((m) => (m.id === message.id ? { ...m, ...message } : m));
            }
            // Deduplicate if last message has identical role and content
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === message.role && lastMsg.content?.trim() === message.content?.trim()) {
                return prev.map((m, idx) => idx === prev.length - 1 ? { ...m, ...message } : m);
            }
            return [...prev, message];
        });
    }, []);

    useEffect(() => {
        refreshConversations();
    }, [refreshConversations]);

    return {
        conversations,
        activeConversationId,
        messages,
        loading,
        refreshConversations,
        selectConversation,
        startNewConversation,
        renameConversation,
        toggleBookmark,
        archiveConversation,
        removeConversation,
        appendMessage,
        setMessages
    };
}

