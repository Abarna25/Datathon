class ConfidenceEngineService {
    /**
     * Algorithmically scores the Evidence Strength based strictly on database reality.
     * @param {Object} context The case context built by ContextBuilderService
     * @returns {Object} Score and explanation
     */
    static calculateScore(context) {
        let score = 20; // Base score for having an open case
        let reasons = [];
        let supportingRecords = [];

        if (!context || !context.case) return { score: 0, level: "LOW", factors: ["No case data available"], description: "LOW (0%)" };

        supportingRecords.push(`Case #${context.case.caseId || context.case.ROWID}`);

        if (context.suspects && context.suspects.length > 0) {
            score += 20;
            reasons.push("Verified Suspects present in case");
            
            const hasRepeatOffender = context.suspects.some(s => s.repeat_offender);
            if (hasRepeatOffender) {
                score += 20;
                reasons.push("Suspect linked to multiple historical cases");
            }
        }

        if (context.chargesheet && context.chargesheet.length > 0) {
            score += 20;
            reasons.push("Procedural Consistency: Chargesheet formally filed");
            supportingRecords.push(`Chargesheet #${context.chargesheet[0].ROWID}`);
        }

        if (context.timeline && context.timeline.length >= 2) {
            const hasOccurrence = context.timeline.some(t => t.source_type === 'occurrence_record');
            const hasArrest = context.timeline.some(t => t.source_type === 'arrest_record');
            if (hasOccurrence && hasArrest) {
                score += 20;
                reasons.push("Verified Temporal Match: Crime occurrence and arrests temporally established");
            }
        }

        // Cap at 100
        score = Math.min(score, 100);

        let level = "LOW";
        if (score >= 90) level = "VERY HIGH";
        else if (score >= 70) level = "HIGH";
        else if (score >= 40) level = "MODERATE";

        return {
            score,
            level,
            factors: reasons,
            supportingRecords,
            description: `${level} (${score}%) - Factors: ${reasons.join(', ')}`
        };
    }
}

module.exports = ConfidenceEngineService;
