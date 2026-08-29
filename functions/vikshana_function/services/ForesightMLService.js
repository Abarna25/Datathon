/**
 * ForesightMLService.js
 * VIKSHANA 3.0 Core Predictive Intelligence Engine
 * 
 * Orchestrates time-safe feature extraction, Python ML Model inference,
 * SHAP factor grounding, and Explainable AI bindings for accused individuals.
 */

const PythonMLBridge = require('./PythonMLBridge');
const ContextBuilderService = require('./ContextBuilderService');
const EntityResolutionService = require('./EntityResolutionService');
const datastoreClient = require('../queries/datastoreClient');

class ForesightMLService {
    /**
     * Assesses an accused person's historical docket associations using the calibrated ML model.
     */
    static async assessAccused(req, { accusedName, caseId }) {
        if (!accusedName) {
            throw new Error('accusedName is required for Foresight assessment.');
        }

        const startTime = Date.now();
        const normName = String(accusedName).trim();

        // 1. Gather historical case linkage for this individual
        let crossCaseMatches = [];
        let repeatProfile = { isRepeatOffender: false, casesLinked: 1, recurringMO: 0 };
        try {
            crossCaseMatches = await EntityResolutionService.findCrossCaseSuspects(req, normName);
            repeatProfile = await EntityResolutionService.getRepeatOffenderProfile(req, normName);
        } catch (err) {
            console.warn('[ForesightMLService] Entity resolution warning:', err.message);
        }

        // 2. Fetch current case details if caseId provided
        let currentCase = null;
        if (caseId) {
            try {
                currentCase = await datastoreClient.getRowById(req, 'CaseMaster', caseId);
            } catch (e) {
                console.warn('[ForesightMLService] Could not fetch current case row:', e.message);
            }
        }

        // 3. Extract time-safe feature hints
        const priorCount = Math.max(0, (repeatProfile.casesLinked || 1) - (caseId ? 1 : 0));
        const isHeinous = currentCase && (currentCase.GravityOffenceID === 1 || currentCase.GravityOffenceID === '1') ? 1 : 0;
        
        const customFeatures = {
            prior_case_count: priorCount,
            current_case_heinous: isHeinous,
            mo_consistency_score: repeatProfile.recurringMO > 0 ? 0.65 : 0.0,
            recurring_location_count: repeatProfile.recurringLocations || 1
        };

        // 4. Invoke Python ML Engine (with JS deterministic fallback)
        const mlResult = await PythonMLBridge.assessForesight(normName, caseId, customFeatures);

        // 5. Enrich Grounded Evidence with real FIR docket references
        const enrichedEvidence = [...(mlResult.groundedEvidence || [])];
        if (crossCaseMatches.length > 1) {
            const supportingDockets = crossCaseMatches
                .map(m => m.CaseMasterID)
                .filter(id => id && String(id) !== String(caseId))
                .slice(0, 4);

            if (supportingDockets.length > 0) {
                enrichedEvidence.push({
                    type: 'HISTORICAL_DOCKET_LINKS',
                    title: `Linked Prior Dockets (${supportingDockets.length} verified)`,
                    detail: `Cross-case entity resolution verified links to: ${supportingDockets.map(d => `Case #${d}`).join(', ')}.`,
                    source: 'EntityResolutionService / AccusedMaster'
                });
            }
        }

        const finalAssessment = {
            ...mlResult,
            executionTimeMs: Date.now() - startTime,
            accusedName: normName,
            caseId: caseId ? String(caseId) : 'N/A',
            groundedEvidence: enrichedEvidence,
            reviewed: false,
            decisionStatus: 'AWAITING_OFFICER_REVIEW'
        };

        return finalAssessment;
    }

    /**
     * Assesses all suspects for a given Case ID.
     */
    static async assessCaseSuspects(req, caseId) {
        if (!caseId) throw new Error('caseId is required.');
        const context = await ContextBuilderService.buildCaseContext(req, caseId);
        const suspects = context.suspects || [];

        if (suspects.length === 0) {
            return {
                caseId,
                suspectCount: 0,
                assessments: [],
                message: 'No suspects recorded for this case.'
            };
        }

        const assessments = await Promise.all(
            suspects.map(async (suspect) => {
                return await this.assessAccused(req, { accusedName: suspect.name, caseId });
            })
        );

        return {
            caseId,
            suspectCount: suspects.length,
            assessments
        };
    }

    /**
     * Retrieves the certified Model Card.
     */
    static async getModelCard(req) {
        const res = await PythonMLBridge.getForesightModelCard();
        return res.modelCard || res;
    }
}

module.exports = ForesightMLService;
