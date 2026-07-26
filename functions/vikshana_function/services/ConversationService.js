const datastoreClient = require('../queries/datastoreClient');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Robust fallback storage for when Catalyst Datastore tables aren't deployed
const LOCAL_DB_PATH = path.join(os.tmpdir(), 'vikshana_chat_history_fallback.json');
let localDb = { Investigation_Conversation: [], Investigation_Message: [] };

try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
        localDb = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf8'));
    }
} catch (e) {
    console.error('Failed to load local chat fallback db:', e.message);
}

function saveLocalDb() {
    try {
        fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(localDb, null, 2));
    } catch (e) {
        console.error('Failed to save local chat fallback db:', e.message);
    }
}

class ConversationService {
    static async listConversations(req, { caseId, officerId }) {
        try {
            const rows = await datastoreClient.getRowsWhere(req, 'Investigation_Conversation', { caseId }, { maxRows: 100 });
            return rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (e) {
            console.error('Error listing conversations (falling back to local cache):', e.message);
            const rows = (localDb.Investigation_Conversation || []).filter(c => String(c.caseId) === String(caseId));
            return rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    }

    static async createConversation(req, { caseId, officerId, title }) {
        const id = `CONV-${Date.now()}`;
        const conversation = {
            id,
            caseId,
            officerId: officerId || 'System',
            title: title || 'New Investigation Chat',
            isBookmarked: false,
            isArchived: false,
            lastMessageAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        try {
            await datastoreClient.insertRow(req, 'Investigation_Conversation', conversation);
            return conversation;
        } catch (e) {
            console.error('Error creating conversation (falling back to local cache):', e.message);
            if (!localDb.Investigation_Conversation) localDb.Investigation_Conversation = [];
            localDb.Investigation_Conversation.push(conversation);
            saveLocalDb();
            return conversation;
        }
    }

    static async getConversation(req, id) {
        let convData = null;
        let msgsData = null;

        try {
            convData = await datastoreClient.getRowsWhere(req, 'Investigation_Conversation', { id }, { maxRows: 1 });
            if (!convData || convData.length === 0) {
                convData = await datastoreClient.getRowsWhere(req, 'Investigation_Conversation', { ROWID: id }, { maxRows: 1 }).catch(() => []);
            }

            if (!convData || convData.length === 0) return null;

            const targetId = convData[0].id || id;
            const targetRowId = convData[0].ROWID ? String(convData[0].ROWID) : id;

            const msgs1 = await datastoreClient.getRowsWhere(req, 'Investigation_Message', { conversationId: targetId }, { maxRows: 500 }).catch(() => []);
            const msgs2 = (targetRowId && targetRowId !== targetId) 
                ? await datastoreClient.getRowsWhere(req, 'Investigation_Message', { conversationId: targetRowId }, { maxRows: 500 }).catch(() => []) 
                : [];

            const msgMap = new Map();
            [...msgs1, ...msgs2].forEach(m => { if (m && (m.id || m.ROWID)) msgMap.set(m.id || m.ROWID, m); });
            msgsData = Array.from(msgMap.values());

        } catch (e) {
            console.error('Error getting conversation (falling back to local cache):', e.message);
            convData = (localDb.Investigation_Conversation || []).filter(c => String(c.id) === String(id) || String(c.ROWID) === String(id));
            msgsData = (localDb.Investigation_Message || []).filter(m => String(m.conversationId) === String(id));
        }

        if (!convData || convData.length === 0) return null;
        
        const messages = (msgsData || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map(m => {
            let parsedCitations = [];
            try { parsedCitations = typeof m.citations === 'string' ? JSON.parse(m.citations) : m.citations; } catch (err) {}
            return {
                ...m,
                citations: parsedCitations || []
            };
        });
        
        return {
            ...convData[0],
            messages
        };
    }

    static async updateConversation(req, id, { title, isBookmarked, isArchived }) {
        try {
            const convData = await datastoreClient.getRowsWhere(req, 'Investigation_Conversation', { id }, { maxRows: 1 });
            if (!convData || convData.length === 0) return null;
            
            const conversation = convData[0];
            const payload = {};
            if (title !== undefined) payload.title = title;
            if (isBookmarked !== undefined) payload.isBookmarked = !!isBookmarked;
            if (isArchived !== undefined) payload.isArchived = !!isArchived;
            payload.lastMessageAt = new Date().toISOString();
            
            if (conversation.ROWID) {
                await datastoreClient.updateRow(req, 'Investigation_Conversation', conversation.ROWID, payload);
            }
            return { ...conversation, ...payload };
        } catch (e) {
            console.error('Error updating conversation (falling back to local cache):', e.message);
            const c = (localDb.Investigation_Conversation || []).find(x => String(x.id) === String(id));
            if (c) {
                if (title !== undefined) c.title = title;
                if (isBookmarked !== undefined) c.isBookmarked = !!isBookmarked;
                if (isArchived !== undefined) c.isArchived = !!isArchived;
                c.lastMessageAt = new Date().toISOString();
                saveLocalDb();
                return c;
            }
            return null;
        }
    }

    static async deleteConversation(req, id) {
        try {
            const convData = await datastoreClient.getRowsWhere(req, 'Investigation_Conversation', { id }, { maxRows: 1 });
            if (!convData || convData.length === 0) return false;
            
            if (convData[0].ROWID) {
                await datastoreClient.deleteRow(req, 'Investigation_Conversation', convData[0].ROWID);
            }
            return true;
        } catch (e) {
            console.error('Error deleting conversation (falling back to local cache):', e.message);
            localDb.Investigation_Conversation = (localDb.Investigation_Conversation || []).filter(x => String(x.id) !== String(id));
            localDb.Investigation_Message = (localDb.Investigation_Message || []).filter(x => String(x.conversationId) !== String(id));
            saveLocalDb();
            return true;
        }
    }

    static async appendMessage(req, conversationId, { role, content, citations = [], attachmentIds = [], suggestions = [], tokenUsage = null }) {
        const message = {
            id: `MSG-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            conversationId,
            role,
            content,
            citations: citations && citations.length > 0 ? JSON.stringify(citations) : "[]",
            createdAt: new Date().toISOString()
        };

        try {
            await datastoreClient.insertRow(req, 'Investigation_Message', message);
            
            const convData = await datastoreClient.getRowsWhere(req, 'Investigation_Conversation', { id: conversationId }, { maxRows: 1 });
            if (convData && convData.length > 0 && convData[0].ROWID) {
                await datastoreClient.updateRow(req, 'Investigation_Conversation', convData[0].ROWID, { lastMessageAt: new Date().toISOString() });
            }
            
            return { ...message, citations: citations || [] };
        } catch (e) {
            console.error('Error appending message (falling back to local cache):', e.message);
            
            if (!localDb.Investigation_Message) localDb.Investigation_Message = [];
            localDb.Investigation_Message.push(message);
            
            if (localDb.Investigation_Conversation) {
                const c = localDb.Investigation_Conversation.find(x => String(x.id) === String(conversationId));
                if (c) c.lastMessageAt = new Date().toISOString();
            }
            saveLocalDb();
            
            return { ...message, citations: citations || [] };
        }
    }
}

module.exports = ConversationService;
