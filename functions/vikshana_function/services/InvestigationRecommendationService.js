const evidenceAggregatorService = require('./EvidenceAggregatorService');

class InvestigationRecommendationService {
    async generateRecommendationsAndGaps(req, caseId) {
        const unified = await evidenceAggregatorService.getAggregatedEvidence(req, caseId);
        
        if (unified.isAggregated || !unified.evidence || unified.evidence.length === 0) {
            return { gaps: [], recommendations: [] };
        }

        const evidence = unified.evidence;
        const gaps = [];
        const recommendations = [];

        const hasVictim = evidence.some(e => e.type === 'Victim');
        const accused = evidence.filter(e => e.source === 'Accused');
        const arrests = evidence.filter(e => e.source === 'ArrestSurrender');
        const hasChargesheet = evidence.some(e => e.source === 'ChargesheetDetails');
        
        if (!hasVictim) {
            gaps.push({
                missing_item: "Missing Victim Details",
                priority: "Medium",
                reasoning: "No formal victim records have been associated with this incident."
            });
            recommendations.push({
                action: "Identify and Register Victim",
                priority: "Medium",
                reason: "Crucial for building the case timeline.",
                expected_impact: "Establishes corpus delicti.",
                confidence: 0.8,
                evidence_used: []
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
                reason: "Identify suspects through witness or CCTV correlation.",
                expected_impact: "Moves investigation to apprehension phase.",
                confidence: 0.9,
                evidence_used: evidence.filter(e => e.type === 'Victim').map(e => String(e.id))
            });
        } else {
            // We have accused. Check if they are arrested.
            const arrestedIds = new Set(arrests.map(a => a.description.match(/ID (\d+)/)?.[1]));
            
            accused.forEach(acc => {
                if (!arrestedIds.has(String(acc.id))) {
                    gaps.push({
                        missing_item: `Missing Arrest Record for ${acc.title}`,
                        priority: "High",
                        reasoning: "Suspect identified but no formal arrest recorded."
                    });
                    recommendations.push({
                        action: `Execute Arrest for ${acc.title}`,
                        priority: "High",
                        reason: "Prevent flight risk.",
                        expected_impact: "Secures suspect for interrogation.",
                        confidence: 0.95,
                        evidence_used: [String(acc.id)]
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
                reason: "Required to proceed to court.",
                expected_impact: "Initiates judicial process.",
                confidence: 0.9,
                evidence_used: []
            });
        }

        if (gaps.length === 0) {
            recommendations.push({
                action: "Prepare for Trial",
                priority: "Medium",
                reason: "All primary evidence components are present.",
                expected_impact: "Ensures successful prosecution.",
                confidence: 0.85,
                evidence_used: evidence.map(e => String(e.id)).slice(0, 5)
            });
        }

        return { gaps, recommendations };
    }
}

module.exports = new InvestigationRecommendationService();
