const evidenceAggregatorService = require('./EvidenceAggregatorService');

class InvestigationRecommendationService {
    async generateRecommendationsAndGaps(req, caseId, context = null, anomalies = []) {
        const unified = await evidenceAggregatorService.getAggregatedEvidence(req, caseId);
        
        const intelligence = {
            readiness: {
                score: 0,
                evaluated: 0,
                present: 0,
                components: [],
                why: "",
                sourceTables: ["CaseMaster", "Accused", "Victim", "Evidence", "ArrestSurrender", "ChargesheetDetails"]
            },
            gaps: []
        };
        
        let hasVictim = false;
        let accused = [];
        let arrests = [];
        let hasChargesheet = false;
        let hasCaseInfo = false;
        let hasEvidence = false;
        
        if (context) {
            hasCaseInfo = !!context.caseDetails;
            hasVictim = context.victims && context.victims.length > 0;
            accused = context.suspects || [];
            arrests = (context.timeline || []).filter(t => t.source_type === 'arrest_record');
            hasChargesheet = context.chargesheet && context.chargesheet.length > 0;
            hasEvidence = context.evidence && context.evidence.length > 0;
        } else if (unified && unified.evidence) {
            const evidence = unified.evidence;
            hasCaseInfo = true;
            hasVictim = evidence.some(e => e.type === 'Victim');
            accused = evidence.filter(e => e.source === 'Accused');
            arrests = evidence.filter(e => e.source === 'ArrestSurrender');
            hasChargesheet = evidence.some(e => e.source === 'ChargesheetDetails');
            hasEvidence = evidence.some(e => e.source === 'Evidence');
        }

        // Feature 5: Investigation Readiness Score
        const components = [
            { name: "Case information", present: hasCaseInfo },
            { name: "Suspect information", present: accused.length > 0 },
            { name: "Victim information", present: hasVictim },
            { name: "Evidence links", present: hasEvidence },
            { name: "Chargesheet", present: hasChargesheet }
        ];

        let presentCount = components.filter(c => c.present).length;
        let evaluatedCount = components.length;

        intelligence.readiness.evaluated = evaluatedCount;
        intelligence.readiness.present = presentCount;
        intelligence.readiness.score = Math.round((presentCount / evaluatedCount) * 100);
        intelligence.readiness.components = components;
        
        const missingCount = evaluatedCount - presentCount;
        if (missingCount === 0) {
            intelligence.readiness.why = `All ${evaluatedCount} evaluated investigation components are present.`;
        } else {
            intelligence.readiness.why = `${missingCount} of ${evaluatedCount} evaluated investigation components are incomplete.`;
        }

        // Feature 1 & 2: Investigation Gap -> Next Best Action + Why it Matters
        if (!hasVictim) {
            intelligence.gaps.push({
                gap: "Missing Victim Details",
                whyItMatters: "No formal victim records have been associated with this incident, making it difficult to establish corpus delicti.",
                recommendedAction: "Identify and register victim details if applicable to the crime category.",
                dataUsed: ["Victim Records", "Case Records"],
                sourceTables: ["Victim", "CaseMaster"],
                confidence: "HIGH",
                explanation: "The absence of a victim record in the datastore indicates an incomplete investigation context for person-centric crimes."
            });
        }

        if (accused.length === 0) {
            intelligence.gaps.push({
                gap: "Missing Suspect Identification",
                whyItMatters: "The investigation cannot proceed to prosecution without formally identifying suspects linked to the case.",
                recommendedAction: "Investigate available evidence to identify and register suspects.",
                dataUsed: ["Accused Records"],
                sourceTables: ["Accused"],
                confidence: "HIGH",
                explanation: "Zero accused records found in the datastore associated with this Case ID."
            });
        } else {
            let arrestedIds = new Set();
            if (context) {
                arrestedIds = new Set(arrests.map(a => String(a.accused_id || a.description.match(/ID (\d+)/)?.[1])));
            } else {
                arrestedIds = new Set(arrests.map(a => a.description?.match(/ID (\d+)/)?.[1]));
            }
            
            accused.forEach(acc => {
                const accId = String(acc.ROWID || acc.id);
                if (!arrestedIds.has(accId) && acc.name !== 'Unknown Accused') {
                    intelligence.gaps.push({
                        gap: `Missing Arrest Record for ${acc.name || acc.title}`,
                        whyItMatters: "Suspect is formally accused but no formal arrest or surrender has been recorded, indicating an unresolved status.",
                        recommendedAction: `Consider executing arrest or verifying legal status for ${acc.name || acc.title}.`,
                        dataUsed: ["Arrest Records", "Accused Records"],
                        sourceTables: ["ArrestSurrender", "Accused"],
                        confidence: "HIGH",
                        explanation: `The suspect ID ${accId} has no corresponding arrest record mapped in the datastore.`
                    });
                }
            });
        }

        if (accused.length > 0 && !hasChargesheet) {
            intelligence.gaps.push({
                gap: "Missing Chargesheet",
                whyItMatters: "The case has identified suspects but no formal chargesheet filed, meaning the court phase cannot begin.",
                recommendedAction: "Review accumulated evidence to draft and file the chargesheet.",
                dataUsed: ["Chargesheet Records", "Accused Records"],
                sourceTables: ["ChargesheetDetails", "CaseMaster"],
                confidence: "HIGH",
                explanation: "No chargesheet details found mapped to the current case ID despite suspects existing."
            });
        }

        return intelligence;
    }
}

module.exports = new InvestigationRecommendationService();
