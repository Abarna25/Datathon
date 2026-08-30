/**
 * EvidenceCorroborationService.js
 * Analyzes evidence to detect multi-source corroboration or conflicts.
 */

class EvidenceCorroborationService {
    static async analyzeCorroboration(evidenceList) {
        if (!evidenceList || evidenceList.length === 0) {
            return 'INSUFFICIENT';
        }

        if (evidenceList.length === 1) {
            return 'SINGLE_SOURCE';
        }

        // Check if there are multiple independent sources
        const sourceTypes = new Set();
        let conflicts = 0;

        for (const ev of evidenceList) {
            if (ev.SourceType) sourceTypes.add(ev.SourceType);
            if (ev.Description && ev.Description.toLowerCase().includes('conflict')) {
                conflicts++;
            }
        }

        if (conflicts > 0) {
            return 'CONFLICTING';
        }

        if (sourceTypes.size > 1) {
            return 'MULTI_SOURCE_CORROBORATED';
        }

        return 'PARTIALLY_CORROBORATED';
    }
}

module.exports = EvidenceCorroborationService;
