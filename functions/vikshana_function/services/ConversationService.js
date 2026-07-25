const catalyst = require('zcatalyst-sdk-node');

class ConversationService {
    static getCache(req) {
        return catalyst.initialize(req).cache().segment('default');
    }

    static async listConversations(req, { caseId, officerId }) {
        try {
            const cache = this.getCache(req);
            // Catalyst cache get/put uses string keys. We'll store an index array under 'conv_index_${caseId}'
            const indexKey = `conv_index_${caseId}`;
            const indexResult = await cache.getValue(indexKey);
            
            if (!indexResult) return [];
            
            const convIds = JSON.parse(indexResult);
            const conversations = [];
            
            for (const id of convIds) {
                const convData = await cache.getValue(`conv_${id}`);
                if (convData) {
                    conversations.push(JSON.parse(convData));
                }
            }
            return conversations;
        } catch (e) {
            console.error('Error listing conversations from cache:', e.message);
            return [];
        }
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
        
        try {
            const cache = this.getCache(req);
            await cache.put(`conv_${id}`, JSON.stringify(conversation), 24); // 24 hour TTL
            await cache.put(`msgs_${id}`, JSON.stringify([]), 24);
            
            const indexKey = `conv_index_${caseId}`;
            let indexResult = await cache.getValue(indexKey).catch(() => null);
            const convIds = indexResult ? JSON.parse(indexResult) : [];
            convIds.push(id);
            await cache.put(indexKey, JSON.stringify(convIds), 24);
            
            return conversation;
        } catch (e) {
            console.error('Error creating conversation in cache:', e.message);
            throw e;
        }
    }

    static async getConversation(req, id) {
        try {
            const cache = this.getCache(req);
            const convData = await cache.getValue(`conv_${id}`);
            if (!convData) return null;
            
            const msgsData = await cache.getValue(`msgs_${id}`);
            const messages = msgsData ? JSON.parse(msgsData) : [];
            
            return {
                ...JSON.parse(convData),
                messages
            };
        } catch (e) {
            console.error('Error getting conversation from cache:', e.message);
            return null;
        }
    }

    static async updateConversation(req, id, { title, isBookmarked, isArchived }) {
        try {
            const cache = this.getCache(req);
            const convData = await cache.getValue(`conv_${id}`);
            if (!convData) return null;
            
            const conversation = JSON.parse(convData);
            if (title !== undefined) conversation.title = title;
            if (isBookmarked !== undefined) conversation.isBookmarked = !!isBookmarked;
            if (isArchived !== undefined) conversation.isArchived = !!isArchived;
            conversation.lastMessageAt = new Date().toISOString();
            
            await cache.put(`conv_${id}`, JSON.stringify(conversation), 24);
            return conversation;
        } catch (e) {
            console.error('Error updating conversation in cache:', e.message);
            return null;
        }
    }

    static async deleteConversation(req, id) {
        try {
            const cache = this.getCache(req);
            await cache.delete(`conv_${id}`);
            await cache.delete(`msgs_${id}`);
            return true;
        } catch (e) {
            console.error('Error deleting conversation in cache:', e.message);
            return false;
        }
    }

    static async appendMessage(req, conversationId, { role, content, citations = [], attachmentIds = [], suggestions = [], tokenUsage = null }) {
        try {
            const cache = this.getCache(req);
            const msgsData = await cache.getValue(`msgs_${conversationId}`);
            const messages = msgsData ? JSON.parse(msgsData) : [];
            
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
            
            messages.push(message);
            await cache.put(`msgs_${conversationId}`, JSON.stringify(messages), 24);
            
            const convData = await cache.getValue(`conv_${conversationId}`);
            if (convData) {
                const conversation = JSON.parse(convData);
                conversation.lastMessageAt = new Date().toISOString();
                await cache.put(`conv_${conversationId}`, JSON.stringify(conversation), 24);
            }
            
            return message;
        } catch (e) {
            console.error('Error appending message to cache:', e.message);
            throw e;
        }
    }
}

module.exports = ConversationService;
