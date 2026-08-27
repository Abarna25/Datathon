const evidenceAggregatorService = require('./EvidenceAggregatorService');

class InvestigationRecommendationService {
    async generateRecommendationsAndGaps(req, caseId, context = null, anomalies = []) {
        const unified = await evidenceAggregatorService.getAggregatedEvidence(req, caseId);
        
        const gaps = [];
        const recommendations = [];
        
        let hasVictim = false;
        let accused = [];
        let arrests = [];
        let hasChargesheet = false;
        
        if (context) {
            hasVictim = context.victims && context.victims.length > 0;
            accused = context.suspects || [];
            arrests = (context.timeline || []).filter(t => t.source_type === 'arrest_record');
            hasChargesheet = context.chargesheet && context.chargesheet.length > 0;
        } else if (unified && unified.evidence) {
            const evidence = unified.evidence;
            hasVictim = evidence.some(e => e.type === 'Victim');
            accused = evidence.filter(e => e.source === 'Accused');
            arrests = evidence.filter(e => e.source === 'ArrestSurrender');
            hasChargesheet = evidence.some(e => e.source === 'ChargesheetDetails');
        }

        if (!hasVictim) {
            gaps.push({
                missing_item: "Missing Victim Details",
                priority: "Medium",
                reasoning: "No formal victim records have been associated with this incident."
            });
            recommendations.push({
                action: "Identify and Register Victim",
                priority: "Medium",
                reason: "• Required for building case timeline\n• Establishes corpus delicti\n• Necessary for generating the initial FIR",
                expected_impact: "Establishes corpus delicti.",
                confidence: 0.8,
                evidence_used: [`Case #${caseId}`]
            });
        }

        if (accused.length === 0) {
            gaps.push({
                missing_item: "Missing Suspect Identification",
                priority: "Critical",
                reasoning: "Investigation cannot proceed to prosecution without identifying suspects."
            });
            recommendations.push({
                action: "Identify Suspects",
                priority: "Critical",
                reason: "• Suspect identity is completely unresolved\n• Prosecution cannot proceed without a named accused\n• CCTV and witness correlation required",
                expected_impact: "Moves investigation to apprehension phase.",
                confidence: 0.9,
                evidence_used: [`Case #${caseId}`]
            });
        } else {
            // We have accused. Check if they are arrested.
            let arrestedIds = new Set();
            if (context) {
                arrestedIds = new Set(arrests.map(a => String(a.accused_id || a.description.match(/ID (\d+)/)?.[1])));
            } else {
                arrestedIds = new Set(arrests.map(a => a.description.match(/ID (\d+)/)?.[1]));
            }
            
            accused.forEach(acc => {
                const accId = String(acc.ROWID || acc.id);
                if (!arrestedIds.has(accId)) {
                    gaps.push({
                        missing_item: `Missing Arrest Record for ${acc.name || acc.title}`,
                        priority: "High",
                        reasoning: "Suspect identified but no formal arrest recorded."
                    });
                    recommendations.push({
                        action: `Execute Arrest for ${acc.name || acc.title}`,
                        priority: "High",
                        reason: `• Suspect ${acc.name || acc.title} is formally accused\n• Flight risk is elevated without arrest\n• Required to secure suspect for interrogation`,
                        expected_impact: "Secures suspect for interrogation.",
                        confidence: 0.95,
                        evidence_used: [`Case #${caseId}`, `Suspect Record #${accId}`]
                    });
                }
            });
        }

        if (accused.length > 0 && !hasChargesheet) {
            gaps.push({
                missing_item: "Missing Chargesheet",
                priority: "Critical",
                reasoning: "Case has suspects but no formal chargesheet filed."
            });
            recommendations.push({
                action: "Draft and File Chargesheet",
                priority: "Critical",
                reason: "• Suspects are mapped but no formal charges filed\n• Necessary to proceed to court phase\n• Overdue based on investigation timeline",
                expected_impact: "Initiates judicial process.",
                confidence: 0.9,
                evidence_used: [`Case #${caseId}`]
            });
        }

        if (anomalies && anomalies.length > 0) {
            anomalies.forEach(anomaly => {
                gaps.push({
                    missing_item: `Anomaly: ${anomaly.type}`,
                    priority: anomaly.severity,
                    reasoning: anomaly.description
                });
                recommendations.push({
                    action: `Resolve Anomaly: ${anomaly.type}`,
                    priority: anomaly.severity,
                    reason: anomaly.description,
                    expected_impact: "Resolving data inconsistency.",
                    confidence: 0.9,
                    evidence_used: anomaly.affectedRecords || []
                });
            });
        }

        if (gaps.length === 0) {
            recommendations.push({
                action: "Prepare for Trial",
                priority: "Medium",
                reason: "All primary evidence components are present.",
                expected_impact: "Ensures successful prosecution.",
                confidence: 0.85,
                evidence_used: []
            });
        }

        return { gaps, recommendations };
    }
}

module.exports = new InvestigationRecommendationService();
