// In-memory conversation service to prevent queries to nonexistent database tables
const memoryConversations = {};
const memoryMessages = {};

class ConversationService {
    static async listConversations(req, { caseId, officerId }) {
        return Object.values(memoryConversations).filter(
            c => String(c.caseId) === String(caseId)
        );
    }

    static async createConversation(req, { caseId, officerId, title }) {
        const id = `CONV-${Date.now()}`;
        const conversation = {
            id,
            caseId,
            officerId,
            title: title || 'New Investigation Chat',
            isBookmarked: false,
            isArchived: false,
            lastMessageAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        memoryConversations[id] = conversation;
        memoryMessages[id] = [];
        return conversation;
    }

    static async getConversation(req, id) {
        const conversation = memoryConversations[id];
        if (!conversation) return null;
        return {
            ...conversation,
            messages: memoryMessages[id] || []
        };
    }

    static async updateConversation(req, id, { title, isBookmarked, isArchived }) {
        const conversation = memoryConversations[id];
        if (!conversation) return null;
        if (title !== undefined) conversation.title = title;
        if (isBookmarked !== undefined) conversation.isBookmarked = !!isBookmarked;
        if (isArchived !== undefined) conversation.isArchived = !!isArchived;
        conversation.lastMessageAt = new Date().toISOString();
        return conversation;
    }

    static async deleteConversation(req, id) {
        delete memoryConversations[id];
        delete memoryMessages[id];
        return true;
    }

    static async appendMessage(req, conversationId, { role, content, citations = [], attachmentIds = [], suggestions = [], tokenUsage = null }) {
        const message = {
            id: `MSG-${Date.now()}-${Math.random()}`,
            conversationId,
            role,
            content,
            citations,
            attachmentIds,
            suggestions,
            tokenUsage,
            createdAt: new Date().toISOString()
        };
        if (!memoryMessages[conversationId]) {
            memoryMessages[conversationId] = [];
        }
        memoryMessages[conversationId].push(message);
        if (memoryConversations[conversationId]) {
            memoryConversations[conversationId].lastMessageAt = new Date().toISOString();
        }
        return message;
    }
}

module.exports = ConversationService;
