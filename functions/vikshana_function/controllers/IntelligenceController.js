/**
 * IntelligenceController.js
 * VIKSHANA 2.0 Core Intelligence Controller
 * Exposes the 7 Novel Intelligence Engines via clean, authenticated REST endpoints.
 */

const InvestigationReasoningService = require('../services/InvestigationReasoningService');
const MOIntelligenceService = require('../services/MOIntelligenceService');
const TemporalNetworkService = require('../services/TemporalNetworkService');
const EmergingPatternService = require('../services/EmergingPatternService');
const EvidenceChainService = require('../services/EvidenceChainService');
const InvestigationGapService = require('../services/InvestigationGapService');
const ExplainableAIService = require('../services/ExplainableAIService');
const AuditService = require('../services/AuditService');

class IntelligenceController {
    // 1. Investigation Reasoning & Ranked Leads
    static async getLeads(req, res) {
        try {
            const { caseId } = req.params;
            if (!caseId) return res.status(400).json({ success: false, error: 'caseId parameter is required' });
            
            const leads = await InvestigationReasoningService.generateLeads(req, caseId);
            await AuditService.logEvent(req, req.user, 'Generated Investigation Leads', `Case:${caseId}`, caseId, 'SUCCESS');
            return res.status(200).json({ success: true, data: leads });
        } catch (error) {
            console.error('[IntelligenceController] getLeads error:', error);
            return res.status(500).json({ success: false, error: error.message || 'Failed to generate investigation leads' });
        }
    }

    // 2. Modus Operandi Intelligence
    static async getMOAnalysis(req, res) {
        try {
            const { caseId } = req.params;
            if (!caseId) return res.status(400).json({ success: false, error: 'caseId parameter is required' });

            const moData = await MOIntelligenceService.getMOAnalysis(req, caseId);
            await AuditService.logEvent(req, req.user, 'Generated MO Profile', `Case:${caseId}`, caseId, 'SUCCESS');
            return res.status(200).json({ success: true, data: moData });
        } catch (error) {
            console.error('[IntelligenceController] getMOAnalysis error:', error);
            return res.status(500).json({ success: false, error: error.message || 'Failed to generate MO analysis' });
        }
    }

    // 3. Temporal Crime Network
    static async getTemporalNetwork(req, res) {
        try {
            const { caseId } = req.params;
            const options = {
                yearFilter: req.query.year,
                entityTypeFilter: req.query.type
            };
            if (!caseId) return res.status(400).json({ success: false, error: 'caseId parameter is required' });

            const netData = await TemporalNetworkService.getTemporalNetwork(req, caseId, options);
            return res.status(200).json({ success: true, data: netData });
        } catch (error) {
            console.error('[IntelligenceController] getTemporalNetwork error:', error);
            return res.status(500).json({ success: false, error: error.message || 'Failed to retrieve temporal network' });
        }
    }

    // 3b. Temporal Connection Provenance
    static async explainConnection(req, res) {
        try {
            const { caseId } = req.params;
            const { sourceId, targetId } = req.query;
            if (!caseId || !sourceId || !targetId) {
                return res.status(400).json({ success: false, error: 'caseId, sourceId, and targetId query params required' });
            }

            const explanation = await TemporalNetworkService.explainConnection(req, caseId, sourceId, targetId);
            return res.status(200).json({ success: true, data: explanation });
        } catch (error) {
            console.error('[IntelligenceController] explainConnection error:', error);
            return res.status(500).json({ success: false, error: error.message || 'Failed to explain connection' });
        }
    }

    // 4. Emerging Crime Pattern Detector
    static async getEmergingPatterns(req, res) {
        try {
            const patterns = await EmergingPatternService.detectEmergingPatterns(req);
            return res.status(200).json({ success: true, data: patterns });
        } catch (error) {
            console.error('[IntelligenceController] getEmergingPatterns error:', error);
            return res.status(500).json({ success: false, error: error.message || 'Failed to detect emerging patterns' });
        }
    }

    // 5. Unified Evidence Chain
    static async getEvidenceChain(req, res) {
        try {
            const { caseId } = req.params;
            if (!caseId) return res.status(400).json({ success: false, error: 'caseId parameter is required' });

            const chain = await EvidenceChainService.getEvidenceChain(req, caseId);
            await AuditService.logEvent(req, req.user, 'Inspected Evidence Chain', `Case:${caseId}`, caseId, 'SUCCESS');
            return res.status(200).json({ success: true, data: chain });
        } catch (error) {
            console.error('[IntelligenceController] getEvidenceChain error:', error);
            return res.status(500).json({ success: false, error: error.message || 'Failed to assemble evidence chain' });
        }
    }

    // 6. Investigation Gaps & Next-Actions
    static async getGapsAndActions(req, res) {
        try {
            const { caseId } = req.params;
            if (!caseId) return res.status(400).json({ success: false, error: 'caseId parameter is required' });

            const gapsAndActions = await InvestigationGapService.getGapsAndActions(req, caseId);
            return res.status(200).json({ success: true, data: gapsAndActions });
        } catch (error) {
            console.error('[IntelligenceController] getGapsAndActions error:', error);
            return res.status(500).json({ success: false, error: error.message || 'Failed to analyze investigation gaps' });
        }
    }

    // 7. Explainable AI (XAI) Contract
    static async explainInsight(req, res) {
        try {
            const { insightType, caseId } = req.params;
            const insightId = req.query.insightId;

            const explanation = await ExplainableAIService.explainInsight(req, { insightType, caseId, insightId });
            return res.status(200).json({ success: true, data: explanation });
        } catch (error) {
            console.error('[IntelligenceController] explainInsight error:', error);
            return res.status(500).json({ success: false, error: error.message || 'Failed to generate XAI explanation' });
        }
    }
}

module.exports = IntelligenceController;
