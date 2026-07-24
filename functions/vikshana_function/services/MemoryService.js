const IGNORE_PATTERN = /\bignore\s+(witness|suspect|complainant|accused)\s+["']?([a-z0-9 ,.'-]{2,60}?)["']?[.!]?$/i;
const PIN_PATTERN = /\b(?:pin|remember)\s+(?:this|that|the following)?:?\s*(.*)/i;

/**
 * MemoryService
 * Handles lightweight entity corrections or pins in local memory context,
 * since the custom datastore table 'InvestigationMemory' is nonexistent.
 */
class MemoryService {
    static async recordIfCorrection(req, { caseId, officerId, message, context }) {
        if (!message) return null;

        const ignoreMatch = message.match(IGNORE_PATTERN);
        if (ignoreMatch) {
            const [, entityType, namePart] = ignoreMatch;
            const name = namePart.trim();
            const type = entityType.toLowerCase();

            // Map to real context keys
            const pool = (type === 'witness' || type === 'complainant')
                ? context.witnesses   // ComplainantDetails rows
                : context.suspects;   // Accused rows

            const target = (pool || []).find(
                (row) => String(row.name || '').toLowerCase().includes(name.toLowerCase())
            );

            console.warn(`[MemoryService IGNORE] Instructed to ignore ${type}: "${target ? target.name : name}" on CaseMasterID: ${caseId}`);
            return { factType: 'ignored_entity', target: target || null };
        }

        const pinMatch = message.match(PIN_PATTERN);
        if (pinMatch) {
            const content = pinMatch[1] && pinMatch[1].trim() ? pinMatch[1].trim() : message;
            console.warn(`[MemoryService PIN] Instructed to remember finding: "${content}" on CaseMasterID: ${caseId}`);
            return { factType: 'pinned_finding' };
        }

        return null;
    }
}

module.exports = MemoryService;
