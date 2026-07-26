const evidenceAggregatorService = require('./EvidenceAggregatorService');

class EvidenceCorrelationService {
    async findCorrelations(req, caseId) {
        const unified = await evidenceAggregatorService.getAggregatedEvidence(req, caseId);
        
        if (unified.isAggregated || !unified.evidence || unified.evidence.length === 0) {
            return [];
        }

        const evidence = unified.evidence;
        const correlations = [];

        const accused = evidence.filter(e => e.source === 'Accused');
        const arrests = evidence.filter(e => e.source === 'ArrestSurrender');
        const victims = evidence.filter(e => e.source === 'Victim');
        const sections = evidence.filter(e => e.source === 'ActSectionAssociation');

        // Correlate Accused to Arrests
        arrests.forEach(arrest => {
            const accIdStr = arrest.description.match(/ID (\d+)/)?.[1];
            if (accIdStr) {
                const acc = accused.find(a => String(a.id) === accIdStr);
                if (acc) {
                    correlations.push({
                        source_evidence_id: String(acc.id),
                        target_evidence_id: String(arrest.id),
                        relationship_type: "Arrest Executed",
                        correlation_score: 1.0,
                        reason: `Arrest record directly linked to Accused ID ${accIdStr}.`,
                        supporting_records: [String(acc.id), String(arrest.id)]
                    });
                }
            }
        });

        // Correlate Victims to Accused (Case co-occurrence)
        victims.forEach(v => {
            accused.forEach(a => {
                correlations.push({
                    source_evidence_id: String(v.id),
                    target_evidence_id: String(a.id),
                    relationship_type: "Co-occurrence in Incident",
                    correlation_score: 0.85,
                    reason: `Both entities are involved in the same primary incident.`,
                    supporting_records: [String(v.id), String(a.id)]
                });
            });
        });
        
        // Correlate Sections to the Case/Accused
        if (sections.length > 0 && accused.length > 0) {
            correlations.push({
                source_evidence_id: String(sections[0].id),
                target_evidence_id: String(accused[0].id),
                relationship_type: "Legal Implication",
                correlation_score: 0.9,
                reason: `Primary suspect faces these applied legal sections.`,
                supporting_records: sections.map(s => String(s.id))
            });
        }

        return correlations;
    }
}

module.exports = new EvidenceCorrelationService();
