const datastoreClient = require('../queries/datastoreClient');
const ContextBuilderService = require('./ContextBuilderService');

class SimilarCaseService {
    static async findSimilarCases(req, activeCaseId) {
        // 1. Fetch the active case and its details
        const context = await ContextBuilderService.buildCaseContext(req, activeCaseId);
        if (!context || !context.case) return [];

        const activeCase = context.case;
        const activeFacts = (activeCase.briefFacts || '').toLowerCase();
        const activeCategory = activeCase.category || '';
        const activeLocation = activeCase.jurisdiction || '';
        
        // Extract basic temporal data (Year-Month) from CrimeRegisteredDate
        let activeDate = activeCase.CrimeRegisteredDate || '';
        let activeMonthYear = activeDate ? activeDate.substring(0, 7) : '';

        // Extract suspects
        const activeSuspectNames = new Set((context.suspects || []).map(s => s.name.toLowerCase()));
        
        // Basic stop words
        const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'of', 'to', 'with', 'for', 'was', 'by', 'that', 'this', 'from']);
        
        const getKeywords = (text) => {
            return new Set(text.match(/\b\w+\b/g)?.filter(w => !stopWords.has(w) && w.length > 3) || []);
        };

        const activeKeywords = getKeywords(activeFacts);
        
        // 2. Fetch all other cases and accused for cross-referencing
        const allCases = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 500 }).catch(() => []);
        const allAccused = await datastoreClient.getRows(req, 'Accused', { maxRows: 500 }).catch(() => []);
        const allChargesheets = await datastoreClient.getRows(req, 'ChargesheetDetails', { maxRows: 500 }).catch(() => []);
        
        const similarities = [];

        for (const candidate of allCases) {
            const candidateId = String(candidate.CaseMasterID || candidate.ROWID);
            if (candidateId === String(activeCaseId)) continue;
            
            let score = 0;
            const matchDetails = {};

            // A. Crime Type (Category) Similarity
            if (candidate.CaseCategoryID && activeCategory && String(candidate.CaseCategoryID) === String(activeCategory)) {
                score += 25;
                matchDetails.crimeType = `Matching crime category: Category ${candidate.CaseCategoryID}`;
            }

            // B. Modus Operandi (MO) Similarity via BriefFacts overlap
            const candidateFacts = (candidate.BriefFacts || '').toLowerCase();
            const candidateKeywords = getKeywords(candidateFacts);
            
            let intersection = 0;
            const sharedKeywords = [];
            for (const word of activeKeywords) {
                if (candidateKeywords.has(word)) {
                    intersection++;
                    sharedKeywords.push(word);
                }
            }
            
            if (intersection >= 3) {
                score += (Math.min(5, intersection) * 5); 
                matchDetails.mo = `Matching MO: Shared keywords (${sharedKeywords.slice(0, 3).join(', ')})`;
            }

            // C. Location Similarity
            if (candidate.PoliceStationID && activeLocation && String(candidate.PoliceStationID) === String(activeLocation)) {
                score += 20;
                matchDetails.location = `Location similarity: Same jurisdiction (Station ${candidate.PoliceStationID})`;
            }
            
            // D. Temporal Similarity
            if (candidate.CrimeRegisteredDate) {
                const candidateMonthYear = candidate.CrimeRegisteredDate.substring(0, 7);
                if (activeMonthYear && candidateMonthYear === activeMonthYear) {
                    score += 15;
                    matchDetails.temporal = `Temporal similarity: Both occurred in ${activeMonthYear}`;
                }
            }
            
            // E. Shared Entities (Accused)
            const candidateAccused = allAccused.filter(a => String(a.CaseMasterID) === candidateId);
            const sharedNames = [];
            for (const accused of candidateAccused) {
                const name = (accused.AccusedName || '').toLowerCase();
                if (name && activeSuspectNames.has(name)) {
                    sharedNames.push(accused.AccusedName);
                }
            }
            if (sharedNames.length > 0) {
                score += 30; // High weight for shared suspect
                matchDetails.sharedEntities = `Shared entities: Suspect ${sharedNames.join(', ')}`;
            }
            
            // F. Shared Evidence (e.g. both have chargesheets filed)
            // Ideally this checks evidence logs, but we use ChargesheetDetails as a proxy for procedural similarity
            const activeHasCS = allChargesheets.some(cs => String(cs.CaseMasterID) === String(activeCaseId));
            const candidateHasCS = allChargesheets.some(cs => String(cs.CaseMasterID) === candidateId);
            if (activeHasCS && candidateHasCS) {
                score += 5;
                matchDetails.sharedEvidence = `Shared evidence profile: Chargesheet formalized`;
            }

            // Must have at least a moderate score to be considered
            if (score > 30) {
                similarities.push({
                    caseId: candidateId,
                    title: (candidate.BriefFacts || '').slice(0, 60) + '...',
                    similarityScore: Math.min(99, score),
                    matchDetails: matchDetails
                });
            }
        }

        // Sort by score descending
        similarities.sort((a, b) => b.similarityScore - a.similarityScore);
        
        return similarities.slice(0, 3); // Return top 3
    }
}

module.exports = SimilarCaseService;
