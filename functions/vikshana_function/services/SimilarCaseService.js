const datastoreClient = require('../queries/datastoreClient');
const ContextBuilderService = require('./ContextBuilderService');
const InvestigationRecommendationService = require('./InvestigationRecommendationService');

class SimilarCaseService {
    static async findSimilarCases(req, activeCaseId) {
        // 1. Fetch active case via ContextBuilderService to get full case data
        const context = await ContextBuilderService.buildCaseContext(req, activeCaseId);
        if (!context || !context.case) return { status: 'Error', message: 'Current case could not be retrieved.', similarCases: [] };

        const activeCase = context.case;
        const activeCategory = activeCase.CaseCategoryID || '';
        const activeLocation = activeCase.PoliceStationID || '';
        const activeFacts = (activeCase.BriefFacts || '').toLowerCase();
        
        let activeMonthYear = '';
        if (activeCase.CrimeRegisteredDate) {
            activeMonthYear = String(activeCase.CrimeRegisteredDate).substring(0, 7); // YYYY-MM
        }

        // Fetch active sections
        const activeSections = await datastoreClient.getRowsByCase(req, 'ActSectionAssociation', activeCaseId);
        const activeSectionIds = new Set(activeSections.map(s => s.ActSectionID).filter(Boolean));

        // 2. Fetch Candidates efficiently using ZCQL filtering
        let candidates = [];
        const conditions = {};
        
        if (activeCategory) {
            conditions.CaseCategoryID = activeCategory;
            candidates = await datastoreClient.getRowsWhere(req, 'CaseMaster', conditions, { maxRows: 300 }).catch(() => []);
        } 
        
        // If still insufficient, add by Location
        if (candidates.length < 10 && activeLocation) {
            const locCandidates = await datastoreClient.getRowsWhere(req, 'CaseMaster', { PoliceStationID: activeLocation }, { maxRows: 300 }).catch(() => []);
            candidates.push(...locCandidates);
        }

        // Fallback to recent 300 if no strong signals
        if (candidates.length === 0) {
            candidates = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 300 }).catch(() => []);
        }

        // Deduplicate candidates
        const uniqueCandidates = [];
        const seen = new Set();
        for (const c of candidates) {
            const cid = String(c.CaseMasterID || c.ROWID);
            if (cid !== String(activeCaseId) && !seen.has(cid)) {
                seen.add(cid);
                uniqueCandidates.push(c);
            }
        }

        if (uniqueCandidates.length === 0) {
            return {
                status: 'No Match',
                message: 'No sufficiently similar historical cases were identified in the available dataset.',
                similarCases: [],
                investigativeLead: null
            };
        }

        // Fetch auxiliary data for candidates (sections, chargesheets, arrests)
        // We will fetch up to 300 sections, chargesheets, and arrests to match against candidates
        const allCandidateSections = await datastoreClient.getRows(req, 'ActSectionAssociation', { maxRows: 500 }).catch(() => []);
        const allCandidateChargesheets = await datastoreClient.getRows(req, 'ChargesheetDetails', { maxRows: 500 }).catch(() => []);
        const allCandidateArrests = await datastoreClient.getRows(req, 'ArrestSurrender', { maxRows: 500 }).catch(() => []);
        
        // Helper to extract words
        const getKeywords = (text) => {
            if (!text) return new Set();
            return new Set(text.match(/\b\w+\b/g)?.filter(w => w.length > 3) || []);
        };
        const activeKeywords = getKeywords(activeFacts);

        const scoredCases = [];

        // 3. Score candidates
        for (const candidate of uniqueCandidates) {
            const candidateId = String(candidate.CaseMasterID || candidate.ROWID);
            let score = 0;
            const reasons = [];
            const dataUsed = new Set(['CaseMaster']);

            // A. Crime Category (40%)
            if (activeCategory && String(candidate.CaseCategoryID) === String(activeCategory)) {
                score += 40;
                reasons.push('Crime Category');
            }

            // B. Location (25%)
            if (activeLocation && String(candidate.PoliceStationID) === String(activeLocation)) {
                score += 25;
                reasons.push('Police Station');
            }

            // C. Legal Sections (20%)
            const cSections = allCandidateSections.filter(s => String(s.CaseMasterID) === candidateId);
            if (cSections.length > 0) dataUsed.add('ActSectionAssociation');
            
            let sharedSection = false;
            for (const s of cSections) {
                if (s.ActSectionID && activeSectionIds.has(s.ActSectionID)) {
                    sharedSection = true;
                    break;
                }
            }
            if (sharedSection) {
                score += 20;
                reasons.push('Legal Section');
            }

            // D. Temporal Proximity (15%)
            if (activeMonthYear && candidate.CrimeRegisteredDate) {
                const candidateMonthYear = String(candidate.CrimeRegisteredDate).substring(0, 7);
                if (candidateMonthYear === activeMonthYear) {
                    score += 15;
                    reasons.push('Temporal Proximity');
                }
            }

            let maxPossible = 0;
            if (activeCategory) maxPossible += 40;
            if (activeLocation) maxPossible += 25;
            if (activeSectionIds.size > 0) maxPossible += 20;
            if (activeMonthYear) maxPossible += 15;
            
            if (maxPossible === 0) maxPossible = 100;
            
            let normalizedScore = Math.round((score / maxPossible) * 100);
            if (normalizedScore > 99) normalizedScore = 99; // Cap at 99%

            if (normalizedScore >= 35) { // Require at least 35% normalized match
                // Extract Outcomes
                const cChargesheets = allCandidateChargesheets.filter(cs => String(cs.CaseMasterID) === candidateId);
                const cArrests = allCandidateArrests.filter(a => String(a.CaseMasterID) === candidateId);
                
                const outcomes = [];
                if (cChargesheets.length > 0) {
                    outcomes.push('Chargesheet Filed');
                    dataUsed.add('ChargesheetDetails');
                }
                if (cArrests.length > 0) {
                    outcomes.push('Arrest Executed');
                    dataUsed.add('ArrestSurrender');
                }
                if (outcomes.length === 0) outcomes.push('Outcome data unavailable in current datastore.');

                let explanation = `${normalizedScore}% similarity because both cases share ${reasons.join(', ')}.`;
                if (reasons.length === 0) explanation = `${normalizedScore}% similarity based on secondary factors.`;

                scoredCases.push({
                    caseId: candidateId,
                    crimeType: candidate.CaseCategoryID || candidate.CrimeMajorHeadID || 'Unknown',
                    date: candidate.CrimeRegisteredDate || 'Unknown',
                    location: candidate.PoliceStationID ? `PS ${candidate.PoliceStationID}` : 'Unknown',
                    similarityScore: normalizedScore,
                    matchedAttributes: reasons,
                    explanation,
                    dataUsed: Array.from(dataUsed).join(' + '),
                    outcomes: outcomes,
                    rawCandidate: candidate
                });
            }
        }

        scoredCases.sort((a, b) => b.similarityScore - a.similarityScore);
        const topCases = scoredCases.slice(0, 5);

        if (topCases.length === 0) {
            return {
                status: 'Weak Match',
                message: 'No strong historical match identified. The available cases share limited attributes.',
                similarCases: [],
                investigativeLead: null
            };
        }

        // 4. Generate Investigative Lead & Gap
        // Reuse InvestigationRecommendationService
        const intelligence = await InvestigationRecommendationService.generateRecommendationsAndGaps(req, activeCaseId);
        const topGap = intelligence.gaps?.[0]; // Best recommendation
        
        let leadText = `${topCases.length} historically similar cases share significant attributes with this investigation. `;
        if (topCases[0].reasons.includes('Same police station')) {
            leadText += `They share the same police station and crime category. `;
        }
        
        let nextBestAction = `Review these historical cases for recurring suspects, locations and investigation patterns.`;
        if (topGap) {
            nextBestAction = topGap.recommendedAction;
        }

        return {
            status: 'Success',
            similarCases: topCases,
            investigativeLead: {
                observation: leadText.trim(),
                nextBestAction: nextBestAction,
                identifiedGap: topGap ? topGap.gap : 'None identified',
                whyItMatters: "Identifying similar cases allows investigators to leverage established evidence patterns and historical precedent.",
                source: "CaseMaster (Similarity Engine)"
            }
        };
    }
}

module.exports = SimilarCaseService;
