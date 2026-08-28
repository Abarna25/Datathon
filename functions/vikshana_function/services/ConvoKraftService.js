const datastoreClient = require('../queries/datastoreClient');
const LLMService = require('./LLMService');

class ConvoKraftService {
    /**
     * Synthesizes audio dictation or interrogation transcripts into structured case findings.
     */
    static async synthesizeDictation(req, { officerId, transcript, caseId }) {
        const text = (transcript || '').trim();
        const timestamp = new Date().toISOString();

        if (!text) {
            return {
                caseId: caseId || null,
                officerId: officerId || req.user?.id || 'Officer',
                originalTranscript: '',
                synthesizedSummary: 'No transcript provided.',
                extractedEntities: { suspects: [], vehicles: [], locations: [], weapons: [], property: [] },
                processedAt: timestamp
            };
        }

        // 1. Algorithmic Entity Extraction
        const suspects = [];
        const vehicles = [];
        const locations = [];
        const weapons = [];
        const property = [];

        // Names & Person identifiers
        const nameMatches = text.match(/\b(?:accused|suspect|person|mr\.|ms\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/gi) || [];
        nameMatches.forEach(m => {
            const clean = m.replace(/^(?:accused|suspect|person|mr\.|ms\.)\s+/i, '').trim();
            if (clean && !suspects.includes(clean)) suspects.push(clean);
        });

        // Vehicles & License Plates
        const vehMatches = text.match(/\b(?:KA|MH|DL|TN|AP|KL)\s*[- ]?\d{1,2}\s*[- ]?[A-Z]{1,3}\s*[- ]?\d{1,4}\b/gi) || [];
        vehMatches.forEach(v => {
            const clean = v.toUpperCase().replace(/\s+/g, '-');
            if (!vehicles.includes(clean)) vehicles.push(clean);
        });
        if (text.toLowerCase().includes('bike') || text.toLowerCase().includes('motorcycle')) vehicles.push('Motorcycle');
        if (text.toLowerCase().includes('car') || text.toLowerCase().includes('van')) vehicles.push('Four-Wheeler Automobile');

        // Locations
        const locMatches = text.match(/\b(?:at|near|in|junction|road|street|nagar|halli|circle)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/gi) || [];
        locMatches.forEach(l => {
            const clean = l.replace(/^(?:at|near|in|junction|road|street|nagar|halli|circle)\s+/i, '').trim();
            if (clean && !locations.includes(clean)) locations.push(clean);
        });

        // Weapons
        if (text.toLowerCase().includes('knife') || text.toLowerCase().includes('blade')) weapons.push('Knife / Edged Weapon');
        if (text.toLowerCase().includes('gun') || text.toLowerCase().includes('pistol')) weapons.push('Firearm');
        if (text.toLowerCase().includes('rod') || text.toLowerCase().includes('crowbar')) weapons.push('Leverage Tool / Crowbar');

        // Property & Valuables
        if (text.toLowerCase().includes('gold') || text.toLowerCase().includes('chain')) property.push('Gold Ornaments / Chain');
        if (text.toLowerCase().includes('cash') || text.toLowerCase().includes('rupees')) property.push('Currency Cash');
        if (text.toLowerCase().includes('mobile') || text.toLowerCase().includes('phone')) property.push('Mobile Phone Device');

        return {
            caseId: caseId || null,
            officerId: officerId || req.user?.id || 'Officer',
            originalTranscript: text,
            synthesizedSummary: `Field Dictation recorded on ${new Date().toLocaleDateString()}: ${text}`,
            extractedEntities: {
                suspects: [...new Set(suspects)],
                vehicles: [...new Set(vehicles)],
                locations: [...new Set(locations)],
                weapons: [...new Set(weapons)],
                property: [...new Set(property)]
            },
            statutoryNotice: 'Field notes processed under Indian Evidence Act guidelines. Cross-verify with Case Diary before submitting.',
            processedAt: timestamp
        };
    }

    /**
     * Parses natural voice commands spoken into field officer headsets or browser speech API.
     */
    static async parseVoiceCommand(req, { commandText, caseId }) {
        const text = (commandText || '').trim();
        const lower = text.toLowerCase();

        // Extract target case ID from spoken query (e.g. "case 104" or "case number 187")
        const caseMatch = text.match(/\b(?:case|case\s+number|case\s+#)\s*([0-9]+)\b/i);
        const detectedCaseId = caseMatch ? caseMatch[1] : (caseId || '101');

        if (lower.includes('similar') || lower.includes('pattern match') || lower.includes('same crime')) {
            return {
                action: 'NAVIGATE_SIMILAR_CASES',
                intent: 'QUERY_SIMILAR_CASES',
                targetCaseId: detectedCaseId,
                spokenResponse: `Retrieving Modus Operandi and similar historical investigations for Case #${detectedCaseId}.`,
                route: `/investigate?caseId=${detectedCaseId}&tab=similar`
            };
        }

        if (lower.includes('lead') || lower.includes('reasoning') || lower.includes('strongest lead')) {
            return {
                action: 'NAVIGATE_INVESTIGATION_LEADS',
                intent: 'QUERY_INVESTIGATION_LEADS',
                targetCaseId: detectedCaseId,
                spokenResponse: `Extracting prioritized investigation leads and suspect cross-correlations for Case #${detectedCaseId}.`,
                route: `/investigate?caseId=${detectedCaseId}&tab=leads`
            };
        }

        if (lower.includes('timeline') || lower.includes('events') || lower.includes('when happened')) {
            return {
                action: 'OPEN_CASE_TIMELINE',
                intent: 'QUERY_TIMELINE',
                targetCaseId: detectedCaseId,
                spokenResponse: `Opening chronological investigation timeline and delay audit for Case #${detectedCaseId}.`,
                route: `/investigate?caseId=${detectedCaseId}&tab=timeline`
            };
        }

        if (lower.includes('evidence') || lower.includes('chain of custody') || lower.includes('cctv') || lower.includes('fingerprint')) {
            return {
                action: 'OPEN_EVIDENCE_CHAIN',
                intent: 'QUERY_EVIDENCE_CHAIN',
                targetCaseId: detectedCaseId,
                spokenResponse: `Opening multi-modal evidence chain and SHA-256 integrity records for Case #${detectedCaseId}.`,
                route: `/investigate?caseId=${detectedCaseId}&tab=evidence`
            };
        }

        if (lower.includes('emerging') || lower.includes('hotspot') || lower.includes('surge') || lower.includes('forecast')) {
            return {
                action: 'OPEN_EMERGING_PATTERNS',
                intent: 'QUERY_EMERGING_PATTERNS',
                targetCaseId: detectedCaseId,
                spokenResponse: 'Opening precinct crime surge detections and predictive hotspot forecasts.',
                route: '/forecasting'
            };
        }

        return {
            action: 'COPILOT_NATURAL_QUERY',
            intent: 'GENERAL_CASE_QUERY',
            targetCaseId: detectedCaseId,
            processedCommand: text,
            spokenResponse: `Routing inquiry to VIKSHANA Copilot for Case #${detectedCaseId}.`,
            route: `/investigate?caseId=${detectedCaseId}&tab=copilot`
        };
    }
}

module.exports = ConvoKraftService;
