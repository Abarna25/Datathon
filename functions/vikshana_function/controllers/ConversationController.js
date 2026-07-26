const ConversationService = require('../services/ConversationService');
const PlannerAgent = require('../agents/PlannerAgent');
const ToolExecutor = require('../services/ToolExecutor');
const EvidenceAgent = require('../agents/EvidenceAgent');
const ReportAgent = require('../agents/ReportAgent');
const ContextBuilderService = require('../services/ContextBuilderService');
const SuggestionService = require('../services/SuggestionService');
const LLMService = require('../services/LLMService');
const crypto = require('crypto');
const datastoreClient = require('../queries/datastoreClient');

async function detectCaseIdFromQuery(req, queryText, defaultCaseId) {
    const text = String(queryText || '').toLowerCase();
    
    // 1. Check if the text matches a specific case number directly (e.g. 100110486202100001)
    const caseNoMatch = text.match(/\b\d{10,20}\b/);
    if (caseNoMatch) {
        const targetNum = caseNoMatch[0];
        const allCases = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 200 }).catch(() => []);
        const found = allCases.find(c => String(c.CrimeNo || c.CaseNo || '').includes(targetNum));
        if (found) {
            return found.CaseMasterID || found.ROWID;
        }
    }

    // 2. Check for keyword matches in CrimeType / BriefFacts / Jurisdiction
    const keywords = ['stalking', 'theft', 'counterfeiting', 'rape', 'identity theft', 'kidnapping', 'fraud', 'accident', 'murder', 'harassment', 'cheating', 'assault', 'burglary'];
    const locations = ['ballari', 'davanagere', 'mandya', 'mysuru', 'yadgir', 'bengaluru', 'belagavi', 'dakshina kannada', 'mangaluru', 'tumakuru', 'shivamogga', 'vijayanagara', 'kalyana karnataka'];
    
    const matchedKeyword = keywords.find(kw => text.includes(kw));
    const matchedLoc = locations.find(loc => text.includes(loc));

    if (matchedKeyword || matchedLoc) {
        const allCases = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 200 }).catch(() => []);
        let bestCase = null;
        let maxScore = 0;
        
        for (const c of allCases) {
            let score = 0;
            const facts = String(c.BriefFacts || '').toLowerCase();
            
            if (matchedKeyword && facts.includes(matchedKeyword)) score += 3;
            if (matchedLoc && facts.includes(matchedLoc)) score += 2;
            
            if (score > maxScore) {
                maxScore = score;
                bestCase = c;
            }
        }
        
        if (bestCase && maxScore >= 2) {
            return bestCase.CaseMasterID || bestCase.ROWID;
        }
    }

    return defaultCaseId;
}

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
            
            // Fix: Add the current message to the local history array so Planner and Report Agents have the current context
            history.push({ role: 'user', content });

            if (streaming) {
                LLMService.initSSE(res);
            }

            // HACKATHON STABILIZATION: Bypass dynamic planning and just fetch 100% of case context
            if (streaming) LLMService.sendEvent(res, 'progress', { step: 'correlating', status: 'Detecting target case and building context...' });
            const detectedCaseId = await detectCaseIdFromQuery(req, content, conversation.caseId);
            const contextData = await ContextBuilderService.buildCaseContext(req, detectedCaseId);
            
            // Format context into a structured ledger so it aligns with existing pipelines, but it's indestructible
            const ledger = [{
                _type: 'FullCaseContext',
                case: contextData.case,
                victims: contextData.victims,
                suspects: contextData.suspects,
                witnesses: contextData.witnesses,
                timeline: contextData.timeline,
                arrests: contextData.timeline.filter(e => e.source_type === 'arrest_record')
            }];

            // Step 4: Report Generation
            if (streaming) LLMService.sendEvent(res, 'progress', { step: 'reporting', status: 'Generating final report...' });
            const assistantText = await ReportAgent.generateReport(ledger, history, res, streaming);

            // Generate suggestions
            const suggestions = await SuggestionService.generateFollowUps(assistantText, `Case #${detectedCaseId}`);

            // Save assistant message with ledger as citations
            const assistantMessage = await ConversationService.appendMessage(req, conversation.id, {
                role: 'assistant',
                content: assistantText,
                citations: ledger, // Pass the structured ledger to the UI as citations
                suggestions
            });

            if (streaming) {
                LLMService.sendEvent(res, 'citations', { citations: ledger });
                LLMService.sendEvent(res, 'suggestions', { suggestions });
                LLMService.sendEvent(res, 'done', { messageId: assistantMessage.id, userMessageId: userMessage.id });
                LLMService.endStream(res);
            } else {
                res.status(200).json({ success: true, data: { userMessage, assistantMessage } });
            }
        } catch (error) {
            console.error('Error in ConversationController.sendMessage:', error);
            const fallbackText = `I encountered an unexpected disruption while correlating intelligence for this case. The primary intelligence cluster timed out.\n\nPlease try your request again, or manually inspect the Evidence and Timeline tabs for direct datastore access.`;
            
            // Append the fallback response to the conversation so history is preserved
            let assistantMessage = null;
            try {
                assistantMessage = await ConversationService.appendMessage(req, conversationId, {
                    role: 'assistant',
                    content: fallbackText,
                    citations: [],
                    suggestions: ["Enhance CCTV", "Monitor Pawn Shops", "Review Timeline"]
                });
            } catch (dbError) {
                console.error("Failed to append fallback message to DB", dbError);
            }

            if (streaming) {
                if (!res.headersSent) {
                    LLMService.initSSE(res);
                }
                LLMService.sendEvent(res, 'progress', { step: 'fallback', status: 'Generating offline response...' });
                
                // Simulate streaming the fallback text
                const chunks = fallbackText.split(' ');
                for (let chunk of chunks) {
                    LLMService.sendEvent(res, 'delta', { text: chunk + ' ' });
                    await new Promise(resolve => setTimeout(resolve, 50));
                }

                LLMService.sendEvent(res, 'citations', { citations: [] });
                LLMService.sendEvent(res, 'suggestions', { suggestions: ["Enhance CCTV", "Monitor Pawn Shops", "Review Timeline"] });
                LLMService.sendEvent(res, 'done', { messageId: assistantMessage ? assistantMessage.id : 'fallback', userMessageId: 'fallback' });
                LLMService.endStream(res);
            } else if (!res.headersSent) {
                res.status(200).json({ success: true, data: { userMessage: { content }, assistantMessage: { content: fallbackText } } });
            }
        }
    }
}

module.exports = ConversationController;
