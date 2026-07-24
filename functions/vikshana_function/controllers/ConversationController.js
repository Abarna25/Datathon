const ContextBuilderService = require('../services/ContextBuilderService');
const RetrievalService = require('../services/RetrievalService');
const SuggestionService = require('../services/SuggestionService');
const MemoryService = require('../services/MemoryService');
const glmClient = require('../services/glmClient');
const glmStreamClient = require('../services/glmStreamClient');
const { buildSystemPrompt } = require('../prompts/investigationChatPrompt');
const { extractCitations, enrichCitations } = require('../utils/citationParser');
const crypto = require('crypto');

const MAX_TOKENS = 1536;

// In-memory session store for chat conversations to prevent querying nonexistent database tables
const memoryConversations = {}; // conversationId -> conversation details
const memoryMessages = {};      // conversationId -> array of messages

class ConversationController {
    static async list(req, res) {
        try {
            const { caseId } = req.query;
            if (!caseId) {
                return res.status(400).json({ success: false, error: 'caseId is required' });
            }
            
            const list = Object.values(memoryConversations).filter(
                c => String(c.caseId) === String(caseId)
            );
            res.status(200).json({ success: true, data: list });
        } catch (error) {
            console.error('Error in ConversationController.list:', error);
            res.status(500).json({ success: false, error: 'Failed to list conversations' });
        }
    }

    static async create(req, res) {
        try {
            const { caseId, officerId, title } = req.body;
            if (!caseId) {
                return res.status(400).json({ success: false, error: 'caseId is required' });
            }
            
            const id = crypto.randomUUID();
            const conversation = {
                id,
                caseId,
                officerId: officerId || req.user?.id || 'System',
                title: title || 'New Investigation Chat',
                isBookmarked: false,
                isArchived: false,
                lastMessageAt: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            
            memoryConversations[id] = conversation;
            memoryMessages[id] = [];
            
            res.status(201).json({ success: true, data: conversation });
        } catch (error) {
            console.error('Error in ConversationController.create:', error);
            res.status(500).json({ success: false, error: 'Failed to create conversation' });
        }
    }

    static async getOne(req, res) {
        try {
            const { id } = req.params;
            const conversation = memoryConversations[id];
            if (!conversation) {
                return res.status(404).json({ success: false, error: 'Conversation not found.' });
            }
            
            res.status(200).json({
                success: true,
                data: {
                    ...conversation,
                    messages: memoryMessages[id] || []
                }
            });
        } catch (error) {
            console.error('Error in ConversationController.getOne:', error);
            res.status(500).json({ success: false, error: 'Failed to load conversation' });
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const { title, isBookmarked, isArchived } = req.body;
            
            const conversation = memoryConversations[id];
            if (!conversation) {
                return res.status(404).json({ success: false, error: 'Conversation not found.' });
            }
            
            if (title !== undefined) conversation.title = title;
            if (isBookmarked !== undefined) conversation.isBookmarked = !!isBookmarked;
            if (isArchived !== undefined) conversation.isArchived = !!isArchived;
            conversation.lastMessageAt = new Date().toISOString();
            
            res.status(200).json({ success: true, data: conversation });
        } catch (error) {
            console.error('Error in ConversationController.update:', error);
            res.status(500).json({ success: false, error: 'Failed to update conversation' });
        }
    }

    static async remove(req, res) {
        try {
            const { id } = req.params;
            delete memoryConversations[id];
            delete memoryMessages[id];
            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error in ConversationController.remove:', error);
            res.status(500).json({ success: false, error: 'Failed to delete conversation' });
        }
    }

    static async sendMessage(req, res) {
        const conversationId = req.params.id;
        const { content, officerId, caseId } = req.body;
        const streaming = req.query.stream !== 'false';

        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, error: 'content is required' });
        }

        try {
            let conversation = memoryConversations[conversationId];
            if (!conversation) {
                const targetCaseId = caseId || req.body.caseId;
                if (!targetCaseId) {
                    return res.status(400).json({ success: false, error: 'caseId is required to auto-create conversation.' });
                }
                
                conversation = {
                    id: conversationId,
                    caseId: targetCaseId,
                    officerId: officerId || req.user?.id || 'System',
                    title: String(content).slice(0, 60) || 'New Investigation Chat',
                    isBookmarked: false,
                    isArchived: false,
                    lastMessageAt: new Date().toISOString(),
                    createdAt: new Date().toISOString()
                };
                memoryConversations[conversationId] = conversation;
                memoryMessages[conversationId] = [];
            }

            const userMessage = {
                id: crypto.randomUUID(),
                conversationId,
                role: 'user',
                content,
                createdAt: new Date().toISOString()
            };
            memoryMessages[conversationId].push(userMessage);

            // Auto title check
            if (memoryMessages[conversationId].length === 1) {
                conversation.title = String(content).slice(0, 60) || 'New Investigation Chat';
            }

            let context = await ContextBuilderService.buildCaseContext(req, conversation.caseId);
            const retrieved = await RetrievalService.retrieve(req, { caseId: conversation.caseId, query: content, context });
            const systemPrompt = buildSystemPrompt({ context, retrieved });

            const recentMessages = memoryMessages[conversationId].slice(-10);
            const glmMessages = [
                { role: 'system', content: systemPrompt },
                ...recentMessages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
            ];

            let assistantText;
            if (streaming) {
                glmStreamClient.initSSE(res);
                assistantText = await glmStreamClient.streamCompletion(res, glmMessages, { maxTokens: MAX_TOKENS });
            } else {
                const result = await glmClient.generate(glmMessages, { maxTokens: MAX_TOKENS });
                assistantText = result.content;
            }

            const citations = enrichCitations(extractCitations(assistantText), retrieved);
            const contextSummary = `Case #${conversation.caseId}, victims: ${context.victims?.length || 0}, accused: ${context.suspects?.length || 0}`;
            const suggestions = await SuggestionService.generateFollowUps(assistantText, contextSummary);

            const assistantMessage = {
                id: crypto.randomUUID(),
                conversationId,
                role: 'assistant',
                content: assistantText,
                citations,
                suggestions,
                createdAt: new Date().toISOString()
            };
            memoryMessages[conversationId].push(assistantMessage);
            conversation.lastMessageAt = new Date().toISOString();

            if (streaming) {
                glmStreamClient.sendEvent(res, 'citations', { citations });
                glmStreamClient.sendEvent(res, 'suggestions', { suggestions });
                glmStreamClient.sendEvent(res, 'done', { messageId: assistantMessage.id, userMessageId: userMessage.id });
                glmStreamClient.endStream(res);
            } else {
                res.status(200).json({ success: true, data: { userMessage, assistantMessage } });
            }
        } catch (error) {
            console.error('Error in ConversationController.sendMessage:', error);
            if (streaming) {
                if (!res.headersSent) {
                    res.status(500).json({ success: false, error: 'AI Processing Error' });
                } else {
                    try {
                        glmStreamClient.sendEvent(res, 'error', { message: 'AI Processing Error' });
                    } finally {
                        glmStreamClient.endStream(res);
                    }
                }
            } else if (!res.headersSent) {
                res.status(500).json({ success: false, error: 'AI Processing Error' });
            }
        }
    }
}

module.exports = ConversationController;
