/**
 * ConfidenceEngineService.js
 * Evidence Confidence & Case Strength Scoring Engine for VIKSHANA.
 * Computes deterministic evidence confidence scores based on case context,
 * witness statements, physical evidence, chargesheets, and timeline integrity.
 */

class ConfidenceEngineService {
    /**
     * Calculates deterministic confidence score and factors for a case context.
     * @param {Object} context - Case context built by ContextBuilderService
     * @returns {Object} { score: number, level: string, factors: Array<string> }
     */
    static calculateScore(context = {}) {
        let score = 30; // Base score for any registered case
        const factors = ['Base case registration score (+30)'];

        if (!context) {
            return {
                score: 30,
                level: 'Low',
                factors: ['Basic case context available']
            };
        }

        // 1. Accused / Suspect Information
        const suspects = context.suspects || context.accused || [];
        if (Array.isArray(suspects) && suspects.length > 0) {
            score += 15;
            factors.push(`Identified ${suspects.length} accused/suspect(s) (+15)`);
        }

        // 2. Victim & Complainant Verification
        const victims = context.victims || [];
        const complainants = context.complainants || [];
        if (victims.length > 0 || complainants.length > 0) {
            score += 10;
            factors.push('Complainant and victim details verified (+10)');
        }

        // 3. Chargesheet Status
        const chargesheet = context.chargesheet || context.chargesheets || [];
        if (Array.isArray(chargesheet) && chargesheet.length > 0) {
            score += 25;
            factors.push('Official chargesheet filed (+25)');
        }

        // 4. Physical / Forensic Evidence & Attachments
        const evidence = context.evidence || context.attachments || [];
        if (Array.isArray(evidence) && evidence.length > 0) {
            const added = Math.min(20, evidence.length * 5);
            score += added;
            factors.push(`Physical/digital evidence records cataloged (+${added})`);
        }

        // 5. Timeline Integrity Check
        const timeline = context.timeline || [];
        if (Array.isArray(timeline) && timeline.length >= 2) {
            // Check for obvious timeline inversions
            let timelineInverted = false;
            for (let i = 0; i < timeline.length - 1; i++) {
                const t1 = new Date(timeline[i].event_time || timeline[i].date).getTime();
                const t2 = new Date(timeline[i + 1].event_time || timeline[i + 1].date).getTime();
                if (!isNaN(t1) && !isNaN(t2) && t1 > t2) {
                    timelineInverted = true;
                    break;
                }
            }
            if (!timelineInverted) {
                score += 10;
                factors.push('Timeline events chronologically consistent (+10)');
            } else {
                factors.push('Timeline anomaly detected (no bonus applied)');
            }
        }

        // Cap score between 0 and 100
        const finalScore = Math.min(100, Math.max(0, score));

        let level = 'Low';
        if (finalScore >= 75) {
            level = 'High';
        } else if (finalScore >= 45) {
            level = 'Medium';
        }

        return {
            score: finalScore,
            level,
            factors
        };
    }
}

module.exports = ConfidenceEngineService;
