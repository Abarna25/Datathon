/**
 * MOIntelligenceService.js
 * VIKSHANA 2.0 Core Intelligence Engine — Novel Engine #2
 * 
 * Extracts multi-dimensional structured Modus Operandi (MO) profiles
 * from case narratives and computes transparent weighted MO similarity
 * across historical cases in Karnataka Police Datastore.
 */

const datastoreClient = require('../queries/datastoreClient');
const ContextBuilderService = require('./ContextBuilderService');

class MOIntelligenceService {
    /**
     * Extracts a structured MO profile from case narrative and metadata.
     */
    static extractMOProfile(caseData) {
        const text = String(caseData.briefFacts || caseData.BriefFacts || caseData.title || '').toLowerCase();
        
        // 1. Entry Method Extraction
        let entryMethod = 'Direct / Public Confrontation';
        if (text.includes('break') || text.includes('door') || text.includes('lock') || text.includes('window') || text.includes('latches')) {
            entryMethod = 'Forced Entry / Lock Tampering';
        } else if (text.includes('snatch') || text.includes('running') || text.includes('grab')) {
            entryMethod = 'Pedestrian Snatching';
        } else if (text.includes('shutter') || text.includes('grill') || text.includes('wall')) {
            entryMethod = 'Commercial Shutter / Perimeter Breach';
        } else if (text.includes('deceit') || text.includes('fraud') || text.includes('impersonat')) {
            entryMethod = 'False Pretense / Impersonation';
        } else if (text.includes('cyber') || text.includes('otp') || text.includes('link') || text.includes('online')) {
            entryMethod = 'Digital / Social Engineering Vector';
        }

        // 2. Target Category Extraction
        let targetCategory = 'General Property / Valuables';
        if (text.includes('gold') || text.includes('jewel') || text.includes('chain') || text.includes('ornament')) {
            targetCategory = 'Gold Jewellery & Precious Metals';
        } else if (text.includes('bike') || text.includes('motorcycle') || text.includes('car') || text.includes('vehicle')) {
            targetCategory = 'Motor Vehicles & Two-Wheelers';
        } else if (text.includes('cash') || text.includes('money') || text.includes('safe') || text.includes('locker')) {
            targetCategory = 'Cash Currency & Safe Deposits';
        } else if (text.includes('phone') || text.includes('mobile') || text.includes('laptop')) {
            targetCategory = 'Mobile Electronics & Devices';
        } else if (text.includes('house') || text.includes('residence') || text.includes('flat')) {
            targetCategory = 'Residential Dwellings';
        }

        // 3. Time Window Extraction
        let timeWindow = 'Unspecified Hour Window';
        const rawDate = caseData.date || caseData.CrimeRegisteredDate || '';
        if (rawDate) {
            const dateObj = new Date(rawDate);
            if (!isNaN(dateObj.getTime())) {
                const hour = dateObj.getHours();
                if (hour >= 22 || hour < 4) timeWindow = 'Late Night (22:00 - 04:00)';
                else if (hour >= 18 && hour < 22) timeWindow = 'Evening Dusk (18:00 - 22:00)';
                else if (hour >= 12 && hour < 18) timeWindow = 'Afternoon (12:00 - 18:00)';
                else timeWindow = 'Morning Hours (06:00 - 12:00)';
            }
        }
        if (timeWindow === 'Unspecified Hour Window') {
            if (text.includes('night') || text.includes('midnight') || text.includes('dark')) timeWindow = 'Late Night (22:00 - 04:00)';
            else if (text.includes('morning')) timeWindow = 'Morning Hours (06:00 - 12:00)';
            else if (text.includes('evening')) timeWindow = 'Evening Dusk (18:00 - 22:00)';
        }

        // 4. Weapon Extraction
        let weaponUsed = 'No Weapon Reported';
        if (text.includes('knife') || text.includes('blade') || text.includes('dagger') || text.includes('machete')) {
            weaponUsed = 'Edged Weapon / Knife';
        } else if (text.includes('iron rod') || text.includes('crowbar') || text.includes('blunt') || text.includes('stick')) {
            weaponUsed = 'Leverage Tool / Blunt Weapon';
        } else if (text.includes('gun') || text.includes('pistol') || text.includes('firearm')) {
            weaponUsed = 'Firearm / Handgun';
        } else if (text.includes('threat') || text.includes('intimidat')) {
            weaponUsed = 'Verbal Intimidation / Physical Coercion';
        }

        // 5. Vehicle Extraction
        let vehicleUsed = 'Unspecified Transit Mode';
        if (text.includes('bike') || text.includes('motorcycle') || text.includes('scooter') || text.includes('pulsar')) {
            vehicleUsed = 'Two-Wheeler Motorcycle / Scooter';
        } else if (text.includes('car') || text.includes('auto') || text.includes('van') || text.includes('suv')) {
            vehicleUsed = 'Four-Wheeler Automobile / Van';
        } else if (text.includes('foot') || text.includes('walk') || text.includes('ran')) {
            vehicleUsed = 'On Foot / Local Transit';
        }

        // 6. Concealment & Escape
        let concealmentEscape = 'Standard Dispersal';
        if (text.includes('mask') || text.includes('helmet') || text.includes('covered face') || text.includes('monkey cap')) {
            concealmentEscape = 'Facial Masking / Full Helmet Concealment';
        } else if (text.includes('cctv') && (text.includes('avoid') || text.includes('turned') || text.includes('spray'))) {
            concealmentEscape = 'Active Surveillance Avoidance';
        } else if (text.includes('highway') || text.includes('ring road') || text.includes('border')) {
            concealmentEscape = 'Arterial Highway Escape Route';
        }

        return {
            entryMethod,
            targetCategory,
            timeWindow,
            weaponUsed,
            vehicleUsed,
            concealmentEscape,
            precinctLocation: caseData.location || caseData.PoliceStationID ? `Station ${caseData.PoliceStationID || caseData.location}` : 'Central HQ'
        };
    }

    /**
     * Computes weighted MO similarity between target profile and candidate profile.
     */
    static calculateMOSimilarity(p1, p2) {
        let score = 0;
        const matched = [];
        const unmatched = [];

        // Weights: Entry (25%), Target (20%), Time (15%), Location (15%), Weapon (10%), Vehicle (10%), Concealment (5%)
        if (p1.entryMethod === p2.entryMethod) {
            score += 0.25;
            matched.push('Entry Method');
        } else {
            unmatched.push('Entry Method');
        }

        if (p1.targetCategory === p2.targetCategory) {
            score += 0.20;
            matched.push('Target Category');
        } else {
            unmatched.push('Target Category');
        }

        if (p1.timeWindow === p2.timeWindow) {
            score += 0.15;
            matched.push('Time Window');
        } else {
            unmatched.push('Time Window');
        }

        if (p1.precinctLocation === p2.precinctLocation) {
            score += 0.15;
            matched.push('Precinct Jurisdiction');
        } else {
            unmatched.push('Precinct Jurisdiction');
        }

        if (p1.weaponUsed === p2.weaponUsed) {
            score += 0.10;
            matched.push('Weapon Profile');
        } else {
            unmatched.push('Weapon Profile');
        }

        if (p1.vehicleUsed === p2.vehicleUsed) {
            score += 0.10;
            matched.push('Vehicle Transit Profile');
        } else {
            unmatched.push('Vehicle Transit Profile');
        }

        if (p1.concealmentEscape === p2.concealmentEscape) {
            score += 0.05;
            matched.push('Concealment/Escape Vector');
        } else {
            unmatched.push('Concealment/Escape Vector');
        }

        return {
            score: Math.round(score * 100) / 100,
            matchedAttributes: matched,
            unmatchedAttributes: unmatched
        };
    }

    /**
     * Generates comprehensive MO Profile and historical pattern matching for a case.
     */
    static async getMOAnalysis(req, caseId) {
        const startTime = Date.now();
        const context = await ContextBuilderService.buildCaseContext(req, caseId);
        
        if (!context || !context.case) {
            return {
                caseId,
                moProfile: null,
                matches: [],
                classification: 'UNAVAILABLE',
                executionTimeMs: Date.now() - startTime
            };
        }

        const targetProfile = this.extractMOProfile(context.case);
        const allCases = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 250 }).catch(() => []);

        const candidateMatches = [];
        for (const candidate of allCases) {
            const cId = String(candidate.CaseMasterID || candidate.ROWID);
            if (cId === String(caseId)) continue;

            const candidateProfile = this.extractMOProfile({
                briefFacts: candidate.BriefFacts,
                CrimeRegisteredDate: candidate.CrimeRegisteredDate,
                PoliceStationID: candidate.PoliceStationID,
                location: candidate.PoliceStationID
            });

            const comparison = this.calculateMOSimilarity(targetProfile, candidateProfile);

            if (comparison.score >= 0.40) {
                candidateMatches.push({
                    caseId: cId,
                    crimeNo: candidate.CrimeNo || candidate.CaseNo || `CASE-${cId}`,
                    briefFacts: candidate.BriefFacts ? candidate.BriefFacts.slice(0, 120) + '...' : 'Details on file',
                    moSimilarity: comparison.score,
                    matchedAttributes: comparison.matchedAttributes,
                    unmatchedAttributes: comparison.unmatchedAttributes,
                    candidateProfile,
                    explanation: `Shares identical ${comparison.matchedAttributes.join(' and ')}.`
                });
            }
        }

        candidateMatches.sort((a, b) => b.moSimilarity - a.moSimilarity);

        return {
            caseId,
            moProfile: targetProfile,
            totalHistoricalAnalyzed: allCases.length,
            matchCount: candidateMatches.length,
            matchedHistoricalCases: candidateMatches.slice(0, 8),
            classification: 'EVIDENCE_BACKED',
            executionTimeMs: Date.now() - startTime
        };
    }
}

module.exports = MOIntelligenceService;
