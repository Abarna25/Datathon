const datastoreClient = require('../queries/datastoreClient');

class EntityResolutionService {
    /**
     * Finds Accused records across all cases that likely represent the same person.
     * @param {Object} req The Express request object
     * @param {String} accusedName The name of the accused
     * @param {Number} age Optional age to help resolution
     * @returns {Array} List of matching accused records from other cases
     */
    static async findCrossCaseSuspects(req, accusedName, age) {
        if (!accusedName) return [];
        
        // Optimised: Fetch only matching names to prevent Catalyst timeout on full-bundle load
        const matches = [];
        try {
            const allAccused = await datastoreClient.getRowsWhere(req, 'Accused', { AccusedName: accusedName }, { maxRows: 50 });
            for (const accused of allAccused) {
                let isMatch = true;
                let matchingFactors = [`Name Exact Match`];
                
                if (age && accused.AgeYear) {
                    const diff = Math.abs(parseInt(age) - parseInt(accused.AgeYear));
                    if (diff <= 5) {
                        matchingFactors.push(`Age proximity within ${diff} years`);
                    } else {
                        isMatch = false; // differs by more than 5 years
                    }
                }
                
                if (isMatch) {
                    matches.push({
                        entityA: accusedName,
                        entityB: accused.AccusedName,
                        matchScore: 1.0,
                        matchingFactors: matchingFactors,
                        supportingCases: [accused.CaseMasterID],
                        rawRecord: accused,
                        CaseMasterID: accused.CaseMasterID
                    });
                }
            }
        } catch(err) {
            console.error("Error in findCrossCaseSuspects:", err);
        }
        return matches;
    }

    static calculateNameSimilarity(name1, name2) {
        const n1 = String(name1).toLowerCase().trim();
        const n2 = String(name2).toLowerCase().trim();
        if (n1 === n2) return 1.0;
        if (n1.includes(n2) || n2.includes(n1)) return 0.85;
        // Simple Jaro-Winkler or similar could be added here
        return 0;
    }
    
    /**
     * Determines if a suspect is a repeat offender based on cross-case linkages
     * and builds an evidence-based behavior profile.
     */
    static async getRepeatOffenderProfile(req, accusedName, age) {
        const matches = await this.findCrossCaseSuspects(req, accusedName, age);
        const uniqueCases = new Set(matches.map(m => m.CaseMasterID).filter(Boolean));
        const linkedCaseIds = Array.from(uniqueCases);

        let recurringMO = 0;
        let recurringLocations = 0;
        let timePattern = 'Unknown';
        let profileSummary = 'Insufficient data to form a behavioral pattern.';

        if (linkedCaseIds.length > 1) {
            // Pull case details for profiling only for the linked cases
            const offenderCases = [];
            const offenderOccurrences = [];
            
            await Promise.all(linkedCaseIds.map(async (cid) => {
                const caseRows = await datastoreClient.getRowsWhere(req, 'CaseMaster', { CaseMasterID: cid }, { maxRows: 1 }).catch(() => []);
                if (caseRows.length > 0) offenderCases.push(caseRows[0]);
                
                const occRows = await datastoreClient.getRowsWhere(req, 'Inv_OccuranceTime', { CaseMasterID: cid }, { maxRows: 10 }).catch(() => []);
                offenderOccurrences.push(...occRows);
            }));

            // Analyze Locations
            const locations = new Set(offenderCases.map(c => c.PoliceStationID).filter(Boolean));
            recurringLocations = locations.size > 0 ? (offenderCases.length - locations.size) + 1 : 0;
            
            // Analyze Time Patterns
            const timeBuckets = { 'Morning': 0, 'Afternoon': 0, 'Evening': 0, 'Night': 0 };
            offenderOccurrences.forEach(o => {
                if (o.OccuranceFromDate) {
                    const hour = new Date(o.OccuranceFromDate).getHours();
                    if (hour >= 6 && hour < 12) timeBuckets['Morning']++;
                    else if (hour >= 12 && hour < 18) timeBuckets['Afternoon']++;
                    else if (hour >= 18) timeBuckets['Evening']++;
                    else timeBuckets['Night']++;
                }
            });
            const peakTime = Object.entries(timeBuckets).sort((a,b)=>b[1]-a[1])[0];
            if (peakTime && peakTime[1] > 0) timePattern = peakTime[0];

            // Analyze MO (Keywords from BriefFacts)
            const keywords = ['vehicle', 'bike', 'car', 'snatch', 'chain', 'break', 'house', 'weapon', 'knife', 'assault'];
            const moHits = {};
            offenderCases.forEach(c => {
                if (c.BriefFacts) {
                    const text = String(c.BriefFacts).toLowerCase();
                    keywords.forEach(k => {
                        if (text.includes(k)) moHits[k] = (moHits[k] || 0) + 1;
                    });
                }
            });
            const repeatMOs = Object.values(moHits).filter(v => v > 1).length;
            recurringMO = repeatMOs;

            // Generate profile summary
            const topMO = Object.entries(moHits).sort((a,b)=>b[1]-a[1])[0];
            let moString = topMO && topMO[1] > 1 ? topMO[0] : 'various';
            profileSummary = `Repeated involvement in incidents involving ${moString}, predominantly occurring during the ${timePattern.toLowerCase()}.`;
        }

        return {
            isRepeatOffender: linkedCaseIds.length > 1,
            casesLinked: linkedCaseIds.length,
            recurringMO,
            recurringLocations,
            timePattern,
            summary: profileSummary,
            linkedCaseRecords: linkedCaseIds
        };
    }
}

module.exports = EntityResolutionService;
