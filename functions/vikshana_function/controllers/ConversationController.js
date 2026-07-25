const ConversationService = require('../services/ConversationService');
const PlannerAgent = require('../agents/PlannerAgent');
const ToolExecutor = require('../services/ToolExecutor');
const EvidenceAgent = require('../agents/EvidenceAgent');
const ReportAgent = require('../agents/ReportAgent');
const SuggestionService = require('../services/SuggestionService');
const glmStreamClient = require('../services/glmStreamClient');
const crypto = require('crypto');

class ConversationController {
    static async list(req, res) {
        try {
            const { caseId } = req.query;
            if (!caseId) {
                return res.status(400).json({ success: false, error: 'caseId is required' });
            }
            const list = await ConversationService.listConversations(req, { caseId });
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
            const conversation = await ConversationService.createConversation(req, { 
                caseId, 
                officerId: officerId || req.user?.id || 'System', 
                title 
            });
            res.status(201).json({ success: true, data: conversation });
        } catch (error) {
            console.error('Error in ConversationController.create:', error);
            res.status(500).json({ success: false, error: 'Failed to create conversation' });
        }
    }

    static async getOne(req, res) {
        try {
            const { id } = req.params;
            const conversation = await ConversationService.getConversation(req, id);
            if (!conversation) {
                return res.status(404).json({ success: false, error: 'Conversation not found.' });
            }
            res.status(200).json({ success: true, data: conversation });
        } catch (error) {
            console.error('Error in ConversationController.getOne:', error);
            res.status(500).json({ success: false, error: 'Failed to load conversation' });
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const { title, isBookmarked, isArchived } = req.body;
            const conversation = await ConversationService.updateConversation(req, id, { title, isBookmarked, isArchived });
            if (!conversation) {
                return res.status(404).json({ success: false, error: 'Conversation not found.' });
            }
            res.status(200).json({ success: true, data: conversation });
        } catch (error) {
            console.error('Error in ConversationController.update:', error);
            res.status(500).json({ success: false, error: 'Failed to update conversation' });
        }
    }

    static async remove(req, res) {
        try {
            const { id } = req.params;
            await ConversationService.deleteConversation(req, id);
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
            let conversation = await ConversationService.getConversation(req, conversationId);
            if (!conversation) {
                const targetCaseId = caseId || req.body.caseId;
                if (!targetCaseId) {
                    return res.status(400).json({ success: false, error: 'caseId is required to auto-create conversation.' });
                }
                conversation = await ConversationService.createConversation(req, {
                    caseId: targetCaseId,
                    officerId: officerId || req.user?.id || 'System',
                    title: String(content).slice(0, 60) || 'New Investigation Chat'
                });
            }

            const history = conversation.messages || [];
            
            // Auto-update title if it's the first message
            if (history.length === 0) {
                await ConversationService.updateConversation(req, conversation.id, { title: String(content).slice(0, 60) });
            }

            const userMessage = await ConversationService.appendMessage(req, conversation.id, {
                role: 'user',
                content
            });

            if (streaming) {
                glmStreamClient.initSSE(res);
            }

            // Step 1: Planner Agent
            if (streaming) glmStreamClient.sendEvent(res, 'progress', { step: 'planning', status: 'Understanding intent...' });
            const plan = await PlannerAgent.generatePlan(content, history);
            
            // Step 2: Tool Execution
            if (streaming) glmStreamClient.sendEvent(res, 'progress', { step: 'executing', status: `Executing tools: ${plan.tools?.join(', ')}...` });
            const toolResults = await ToolExecutor.executePlan(plan, req);
            
            // Step 3: Evidence Aggregation
            if (streaming) glmStreamClient.sendEvent(res, 'progress', { step: 'correlating', status: 'Aggregating evidence ledger...' });
            const ledger = await EvidenceAgent.correlateEvidence(toolResults);

            // Step 4: Report Generation
            if (streaming) glmStreamClient.sendEvent(res, 'progress', { step: 'reporting', status: 'Generating final report...' });
            const assistantText = await ReportAgent.generateReport(ledger, history, res, streaming);

            // Generate suggestions
            const suggestions = await SuggestionService.generateFollowUps(assistantText, `Case #${conversation.caseId}`);

            // Save assistant message with ledger as citations
            const assistantMessage = await ConversationService.appendMessage(req, conversation.id, {
                role: 'assistant',
                content: assistantText,
                citations: ledger, // Pass the structured ledger to the UI as citations
                suggestions
            });

            if (streaming) {
                glmStreamClient.sendEvent(res, 'citations', { citations: ledger });
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
                    res.status(500).json({ success: false, error: 'AI Processing Error', message: error.message, stack: error.stack });
                } else {
                    try {
                        glmStreamClient.sendEvent(res, 'error', { message: `AI Processing Error: ${error.message}` });
                    } finally {
                        glmStreamClient.endStream(res);
                    }
                }
            } else if (!res.headersSent) {
                res.status(500).json({ success: false, error: 'AI Processing Error', message: error.message, stack: error.stack });
            }
        }
    }
}

module.exports = ConversationController;
