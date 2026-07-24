const glmClient = require('../services/glmClient');
const ContextBuilderService = require('../services/ContextBuilderService');
const AILogService = require('../services/AILogService');
const datastoreClient = require('../queries/datastoreClient');

class DecisionSupportController {
    static async getContextAndGenerate(req, caseId) {
        const context = await ContextBuilderService.buildCaseContext(req, caseId);
        if (!context || !context.case) {
            throw new Error(`Case not found: ${caseId}`);
        }

        // Fetch all other cases for similar cases query
        const allCases = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 100 }).catch(() => []);

        const systemPrompt = `You are a Senior Investigator Decision Support AI system.
        Analyze the following active Case Context and Historical Cases:
        
        Active Case Context:
        ${JSON.stringify(context)}
        
        Historical Cases (for identifying similar cases):
        ${JSON.stringify(allCases)}

        Your task is to analyze the details, suspects, victims, evidence, witnesses, and timeline to produce a comprehensive, structured decision support report.
        You MUST return ONLY a valid JSON object matching this exact schema (no prose, no code fences):
        {
          "overview": {
            "caseId": "ID of active case",
            "firNumber": "FIR number or case number",
            "crimeType": "Type of crime",
            "crimeSeverity": "CRITICAL (LEVEL 1) | HIGH | MEDIUM | LOW",
            "investigationStatus": "ACTIVE_72HR_WINDOW | UNDER_INVESTIGATION | SUSPENDED",
            "officerAssigned": "Name of assigned officer",
            "priority": "HIGH_PRIORITY | MEDIUM | LOW",
            "district": "Precinct or district name",
            "dateOpened": "ISO date opened",
            "lastUpdated": "ISO date last updated"
          },
          "aiCaseSummary": {
            "executiveSummary": "Brief overview of the situation...",
            "crimeSummary": "Brief summary of the offense details...",
            "investigationProgress": "Brief summary of what has been accomplished...",
            "majorFindings": ["Finding 1", "Finding 2"],
            "currentStatus": "Summary status line"
          },
          "victimSummary": {
            "details": { "name": "Name", "age": 35, "role": "Victim role", "contact": "Phone or N/A" },
            "timeline": [{ "time": "Time", "event": "Event description" }],
            "injurySummary": "Description of physical or economic impact",
            "riskFactors": ["Risk factor 1", "Risk factor 2"],
            "relatedCases": []
          },
          "suspectSummary": {
            "offenderId": "ROWID of prime suspect",
            "name": "Name of suspect",
            "riskScore": 85,
            "riskLevel": "CRITICAL | HIGH | MEDIUM | LOW",
            "currentCharges": "Charges sections",
            "behaviourSummary": "MO pattern description...",
            "knownAssociates": []
          },
          "evidenceSummary": {
            "physical": ["Physical evidence items"],
            "digital": ["Digital/ANPR/CCTV evidence items"],
            "financial": ["Financial transactions flagged"],
            "witnessStatements": ["Witness interviews log"],
            "forensicReports": ["Forensic/Ballistic matches"],
            "timeline": [{ "time": "Time", "event": "Evidence discovery event" }],
            "status": "PHYSICAL_SECURED",
            "missingEvidence": ["Critical gaps in evidence"]
          },
          "witnessSummary": {
            "witnesses": [
              { "name": "Witness Name", "role": "Role description", "reliability": "90%", "interviewStatus": "COMPLETED | SCHEDULED", "followUp": "Action item" }
            ]
          },
          "investigationProgress": {
            "timeline": [{ "date": "Date", "task": "Completed/pending step" }],
            "completedTasks": ["Task 1", "Task 2"],
            "pendingTasks": ["Task A", "Task B"],
            "investigationScore": 75,
            "completionPercentage": "65%",
            "officerNotes": "Key recommendation from lead investigator..."
          },
          "aiExecutiveSummary": {
            "currentSituation": "Detailed tactical summary...",
            "strongEvidence": ["Evidentiary pillar 1", "Evidentiary pillar 2"],
            "weakEvidence": ["Evidentiary gap 1"],
            "riskAssessment": "Threat assessment...",
            "recommendations": ["Action item 1", "Action item 2"],
            "confidence": "HIGH (90%)",
            "evidenceReferences": []
          },
          "leadRecommendations": {
            "highestPrioritySuspect": { "name": "Name", "reason": "Reason...", "action": "Action to take..." },
            "highestPriorityEvidence": { "name": "Name", "reason": "Reason...", "action": "Action to take..." },
            "recommendedWitness": { "name": "Name", "reason": "Reason...", "action": "Action to take..." },
            "digitalInvestigation": "Action item",
            "financialInvestigation": "Action item",
            "searchWarrant": "Action item",
            "surveillance": "Action item",
            "arrestRecommendation": "Action item"
          },
          "missingEvidence": {
            "documents": ["Missing document 1"],
            "forensicReports": ["Missing forensic report 1"],
            "witnessInterviews": ["Witness to interview"],
            "digitalEvidence": ["Digital dump/CCTV to collect"],
            "approvals": ["Warrants/freezes to request"]
          },
          "investigationRisk": {
            "caseRisk": "HIGH (Level 3) | MEDIUM | LOW",
            "evidenceRisk": "HIGH | MEDIUM | LOW",
            "witnessRisk": "HIGH | MEDIUM | LOW",
            "offenderEscapeRisk": "CRITICAL | HIGH | MEDIUM | LOW",
            "evidenceTamperingRisk": "HIGH | MEDIUM | LOW"
          },
          "investigationPriority": {
            "priorityScore": 85,
            "crimeSeverityScore": 85,
            "offenderHistoryScore": 80,
            "evidenceStrengthScore": 75,
            "victimRiskScore": 70,
            "timeSensitivityScore": 90,
            "priorityTier": "TIER 1 - CRITICAL | TIER 2 | TIER 3"
          },
          "similarCasesRecommendation": [
            { "caseId": "Similar historical case ID", "matchReason": "Why it matches active case", "recommendedStrategy": "Strategy to replicate..." }
          ],
          "automaticTimeline": [
            { "time": "Time of event", "title": "Title", "description": "Details..." }
          ]
        }`;

        const res = await glmClient.generate([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Generate consolidated decision support report JSON.' }
        ], { temperature: 0.2 });

        const raw = res.content.trim().replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
        return JSON.parse(raw);
    }

    static async getSummary(req, res) {
        try {
            const caseId = req.params.caseId || req.query.caseId;
            if (!caseId) {
                return res.status(400).json({ success: false, error: 'caseId parameter is required' });
            }
            const data = await DecisionSupportController.getContextAndGenerate(req, caseId);
            const summaryData = {
                overview: data.aiCaseSummary?.executiveSummary || data.aiCaseSummary?.crimeSummary || 'No case overview compiled.',
                victimSummary: data.victimSummary?.injurySummary || (data.victimSummary?.details?.name ? `Victim: ${data.victimSummary.details.name}` : 'No victim details resolved.'),
                accusedSummary: data.suspectSummary?.behaviourSummary || (data.suspectSummary?.name ? `Accused: ${data.suspectSummary.name}` : 'No suspect details resolved.'),
                evidenceSummary: data.evidenceSummary?.status || 'No evidence records resolved.'
            };
            res.status(200).json({ success: true, data: summaryData });
        } catch (error) {
            console.error('Error in DecisionSupportController.getSummary:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
 
    static async getTimeline(req, res) {
        try {
            const caseId = req.params.caseId || req.query.caseId;
            if (!caseId) {
                return res.status(400).json({ success: false, error: 'caseId parameter is required' });
            }
            const data = await DecisionSupportController.getContextAndGenerate(req, caseId);
            const timelineEvents = (data.automaticTimeline || []).map(t => ({
                timestamp: new Date().toISOString(),
                type: 'AUTOMATED',
                title: t.title || 'Timeline Event',
                description: t.description || 'No description.',
                source: 'AI Analysis'
            }));
            res.status(200).json({ success: true, data: timelineEvents });
        } catch (error) {
            console.error('Error in DecisionSupportController.getTimeline:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
 
    static async getSimilarCases(req, res) {
        try {
            const caseId = req.params.caseId || req.query.caseId;
            if (!caseId) {
                return res.status(400).json({ success: false, error: 'caseId parameter is required' });
            }
            const data = await DecisionSupportController.getContextAndGenerate(req, caseId);
            const precedents = (data.similarCasesRecommendation || []).map(c => ({
                title: `Case match for ID ${c.caseId}`,
                caseId: c.caseId,
                matchReason: c.matchReason || 'Highly matching MO patterns.',
                evidenceMatch: ['Modus Operandi', 'Crime Category'],
                similarityScore: '85%'
            }));
            res.status(200).json({ success: true, data: precedents });
        } catch (error) {
            console.error('Error in DecisionSupportController.getSimilarCases:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
 
    static async getLeadRecommendations(req, res) {
        try {
            const caseId = req.params.caseId || req.query.caseId;
            if (!caseId) {
                return res.status(400).json({ success: false, error: 'caseId parameter is required' });
            }
            const data = await DecisionSupportController.getContextAndGenerate(req, caseId);
            const recommendations = [];
            const lr = data.leadRecommendations || {};
            if (lr.highestPrioritySuspect) {
                recommendations.push({
                    category: 'Accused Priority',
                    confidence: 'HIGH',
                    recommendation: `Interrogate Accused: ${lr.highestPrioritySuspect.name}`,
                    reason: lr.highestPrioritySuspect.reason || lr.highestPrioritySuspect.action
                });
            }
            if (lr.highestPriorityEvidence) {
                recommendations.push({
                    category: 'Evidence Collection',
                    confidence: 'HIGH',
                    recommendation: `Secure evidence: ${lr.highestPriorityEvidence.name}`,
                    reason: lr.highestPriorityEvidence.reason || lr.highestPriorityEvidence.action
                });
            }
            if (lr.recommendedWitness) {
                recommendations.push({
                    category: 'Witness Interview',
                    confidence: 'MEDIUM',
                    recommendation: `Interview Complainant/Witness: ${lr.recommendedWitness.name}`,
                    reason: lr.recommendedWitness.reason || lr.recommendedWitness.action
                });
            }
            if (lr.digitalInvestigation) {
                recommendations.push({
                    category: 'Digital Investigation',
                    confidence: 'HIGH',
                    recommendation: 'Digital Device Analysis',
                    reason: lr.digitalInvestigation
                });
            }
            if (lr.arrestRecommendation) {
                recommendations.push({
                    category: 'Legal Action',
                    confidence: 'CRITICAL',
                    recommendation: 'Arrest Order Recommendation',
                    reason: lr.arrestRecommendation
                });
            }
            res.status(200).json({ success: true, data: recommendations });
        } catch (error) {
            console.error('Error in DecisionSupportController.getLeadRecommendations:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
 
    static async getFullCaseSupport(req, res) {
        try {
            const caseId = req.params.caseId || req.query.caseId;
            if (!caseId) {
                return res.status(400).json({ success: false, error: 'caseId parameter is required' });
            }
            const data = await DecisionSupportController.getContextAndGenerate(req, caseId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error('Error in DecisionSupportController.getFullCaseSupport:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
 
    static async generateExecutiveSummary(req, res) {
        try {
            const { caseId } = req.body || {};
            if (!caseId) {
                return res.status(400).json({ success: false, error: 'caseId is required in body' });
            }
            const data = await DecisionSupportController.getContextAndGenerate(req, caseId);
            const aiData = data.aiExecutiveSummary;
            await AILogService.logInteraction(req, req.user, caseId, 'Generate Executive Summary', 'crm-di-glm47b', aiData.confidence, aiData.evidenceReferences);
            res.status(200).json({ success: true, data: aiData });
        } catch (error) {
            console.error('Error in DecisionSupportController.generateExecutiveSummary:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
 
    static async queryAIAssistant(req, res) {
        try {
            const { prompt, caseId } = req.body || {};
            if (!prompt) {
                return res.status(400).json({ success: false, error: 'prompt is required.' });
            }
            if (!caseId) {
                return res.status(400).json({ success: false, error: 'caseId is required.' });
            }
 
            const context = await ContextBuilderService.buildCaseContext(req, caseId);
 
            const promptTemplate = `You are a Senior Investigator AI Assistant.
            Analyze the following active Case Context:
            ${JSON.stringify(context)}
 
            Answer the investigator's question: "${prompt}"
            Return a STRICT JSON response matching this schema:
            {
              "answer": "Detailed answer addressing question based on evidence context...",
              "confidence": "HIGH | MEDIUM | LOW",
              "evidenceReferences": ["Reference RowIDs/Evidence IDs used"],
              "dataSources": ["Source names"]
            }
            Do NOT include markdown blocks.`;
 
            const resGLM = await glmClient.generate([
                { role: 'system', content: promptTemplate },
                { role: 'user', content: prompt }
            ], { temperature: 0.3 });
 
            const cleaned = resGLM.content.trim().replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
            const responseData = JSON.parse(cleaned);
 
            await AILogService.logInteraction(req, req.user, caseId, prompt, 'crm-di-glm47b', responseData.confidence, responseData.evidenceReferences);
 
            res.status(200).json({
                success: true,
                data: responseData
            });
        } catch (error) {
            console.error('Error in DecisionSupportController.queryAIAssistant:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = DecisionSupportController;
