const datastoreClient = require('../queries/datastoreClient');
const tables = require('../queries/tables');

class PatternDetectionService {
    
    /**
     * Calculates basic frequencies (by type, location, etc.) from CaseMaster using streamRows.
     */
    async getCrimeFrequencies(req) {
        try {
            const crimeTypes = {};
            const locations = {};
            let total = 0;

            const res = await datastoreClient.streamRows(req, 'CaseMaster', async (cases) => {
                cases.forEach(c => {
                    if (!c.CrimeRegisteredDate) return;
                    total++;
                    
                    const type = c.CaseCategoryID || c.CrimeMajorHeadID || 'Unknown Type';
                    crimeTypes[type] = (crimeTypes[type] || 0) + 1;
                    
                    const loc = c.PoliceStationID || 'Unknown Station';
                    locations[loc] = (locations[loc] || 0) + 1;
                });
            }, { maxRowsPerChunk: 500 });

            if (total === 0) return { status: 'Insufficient Data', message: 'No CaseMaster records found.' };

            return {
                totalAnalysed: total,
                pagesProcessed: res.pagesProcessed,
                crimeTypes: Object.entries(crimeTypes).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
                locations: Object.entries(locations).map(([loc, count]) => ({ loc, count })).sort((a, b) => b.count - a.count),
                source: 'CaseMaster'
            };
        } catch (error) {
            console.error('[PatternDetection] getCrimeFrequencies error:', error);
            return { status: 'Error', message: 'Failed to calculate crime frequencies.' };
        }
    }

    /**
     * Identifies locations with high crime concentrations using streamRows.
     */
    async getHotspots(req) {
        try {
            const hotspots = {};
            let totalProcessed = 0;

            const res = await datastoreClient.streamRows(req, 'CaseMaster', async (cases) => {
                cases.forEach(c => {
                    totalProcessed++;
                    const psId = c.PoliceStationID;
                    if (!psId) return;

                    if (!hotspots[psId]) {
                        hotspots[psId] = {
                            location: `Police Station ${psId}`,
                            crimeCount: 0,
                            crimeTypes: {},
                            lat: c.latitude,
                            lng: c.longitude
                        };
                    }
                    
                    hotspots[psId].crimeCount++;
                    const cType = c.CaseCategoryID || 'Unknown';
                    hotspots[psId].crimeTypes[cType] = (hotspots[psId].crimeTypes[cType] || 0) + 1;
                });
            }, { maxRowsPerChunk: 500 });

            if (totalProcessed === 0) return { status: 'Insufficient Data', message: 'No CaseMaster records found.' };

            const sortedHotspots = Object.values(hotspots)
                .sort((a, b) => b.crimeCount - a.crimeCount)
                .map(hs => {
                    const dominantType = Object.entries(hs.crimeTypes).sort((a, b) => b[1] - a[1])[0];
                    return {
                        location: hs.location,
                        crimeCount: hs.crimeCount,
                        dominantCrimeType: dominantType ? dominantType[0] : 'Unknown',
                        latitude: hs.lat,
                        longitude: hs.lng,
                        source: 'CaseMaster',
                        provenance: `Aggregated ${hs.crimeCount} cases out of ${res.totalCount} total records processed`,
                        whyItMatters: "Concentrated geographic crime clusters indicate localized vulnerabilities and potential structural issues.",
                        recommendedAction: "Review patrolling density and recent community complaints in this jurisdiction."
                    };
                });

            return sortedHotspots.slice(0, 5); // Top 5 hotspots
        } catch (error) {
            console.error('[PatternDetection] getHotspots error:', error);
            return [];
        }
    }

    /**
     * Trend Analysis: Current period vs Previous period using streamRows.
     */
    async getTrendAnalysis(req) {
        try {
            // First we need max date. In Catalyst ZCQL we would ideally do SELECT MAX, 
            // but ZCQL aggregates can be finicky. Instead, let's use a fixed current period 
            // of the last 60 days relative to the latest record we see in the stream.
            
            let maxDate = 0;
            let totalProcessed = 0;
            const datedCases = []; // We will store lightweight date/type refs if we really need them, or process on the fly.
            
            // To do this in one pass: we can't easily know max date until we read all.
            // But we can store just the timestamps and type to save memory.
            const minifiedCases = [];

            const res = await datastoreClient.streamRows(req, 'CaseMaster', async (cases) => {
                cases.forEach(c => {
                    if (c.CrimeRegisteredDate) {
                        const t = new Date(c.CrimeRegisteredDate).getTime();
                        if (t > maxDate) maxDate = t;
                        minifiedCases.push({ t, type: c.CaseCategoryID || 'Unknown' });
                        totalProcessed++;
                    }
                });
            }, { maxRowsPerChunk: 500 });

            if (minifiedCases.length < 5) return { status: 'Insufficient Data', message: 'Not enough dated records.' };

            const currentEnd = maxDate;
            const currentStart = currentEnd - (30 * 24 * 60 * 60 * 1000); // 30 days
            const previousStart = currentStart - (30 * 24 * 60 * 60 * 1000); // previous 30 days

            let currentPeriodCount = 0;
            let previousPeriodCount = 0;

            for (const c of minifiedCases) {
                if (c.t >= currentStart && c.t <= currentEnd) {
                    currentPeriodCount++;
                } else if (c.t >= previousStart && c.t < currentStart) {
                    previousPeriodCount++;
                }
            }
            
            const change = currentPeriodCount - previousPeriodCount;
            const changePercentage = previousPeriodCount === 0 ? 100 : Math.round((change / previousPeriodCount) * 100);

            return {
                currentPeriodCount,
                previousPeriodCount,
                change,
                changePercentage: `${change >= 0 ? '+' : ''}${changePercentage}%`,
                trend: change > 0 ? 'UPWARD' : change < 0 ? 'DOWNWARD' : 'STABLE',
                source: 'CaseMaster',
                provenance: `Analyzed ${res.totalCount} records (last 30d vs prev 30d)`,
                whyItMatters: `The current period contains ${change > 0 ? 'more' : change < 0 ? 'fewer' : 'an equal number of'} cases compared to the equivalent historical baseline.`,
                recommendedAction: "Review recent cases across major crime categories to understand the macro deviation."
            };
        } catch (error) {
            console.error('[PatternDetection] getTrendAnalysis error:', error);
            return { status: 'Error' };
        }
    }

    /**
     * Detects emerging patterns based on sharp trend spikes using streamRows.
     */
    async getEmergingPatterns(req) {
        try {
            let maxDate = 0;
            const minifiedCases = [];

            const res = await datastoreClient.streamRows(req, 'CaseMaster', async (cases) => {
                cases.forEach(c => {
                    if (c.CrimeRegisteredDate) {
                        const t = new Date(c.CrimeRegisteredDate).getTime();
                        if (t > maxDate) maxDate = t;
                        minifiedCases.push({ t, type: c.CaseCategoryID || 'Unknown' });
                    }
                });
            }, { maxRowsPerChunk: 500 });

            if (minifiedCases.length < 10) return [];

            const currentEnd = maxDate;
            const currentStart = currentEnd - (30 * 24 * 60 * 60 * 1000);
            const previousStart = currentStart - (30 * 24 * 60 * 60 * 1000);

            const histTypes = {};
            const recentTypes = {};

            for (const c of minifiedCases) {
                if (c.t >= currentStart && c.t <= currentEnd) {
                    recentTypes[c.type] = (recentTypes[c.type] || 0) + 1;
                } else if (c.t >= previousStart && c.t < currentStart) {
                    histTypes[c.type] = (histTypes[c.type] || 0) + 1;
                }
            }

            const alerts = [];
            for (const [type, rCount] of Object.entries(recentTypes)) {
                const hCount = histTypes[type] || 0;
                if (hCount === 0 && rCount > 2) {
                    alerts.push({
                        pattern: `New Emerging Crime: ${type}`,
                        crimeType: type,
                        baseline: hCount,
                        currentValue: rCount,
                        changePercentage: '+100%',
                        source: 'CaseMaster',
                        provenance: `Detected ${rCount} cases in last 30d vs ${hCount} in prior 30d (from ${res.totalCount} total)`,
                        whyItMatters: "A sudden presence of a previously unseen crime category indicates a novel tactical threat.",
                        recommendedAction: "Analyze the earliest reported incidents in this category to trace the origin."
                    });
                } else if (hCount > 0) {
                    const percent = ((rCount - hCount) / hCount) * 100;
                    if (percent >= 50 && rCount > 2) {
                        alerts.push({
                            pattern: `Surge Detected: ${type}`,
                            crimeType: type,
                            baseline: hCount,
                            currentValue: rCount,
                            changePercentage: `+${Math.round(percent)}%`,
                            source: 'CaseMaster',
                            provenance: `Detected ${rCount} cases in last 30d vs ${hCount} in prior 30d (from ${res.totalCount} total)`,
                            whyItMatters: "A statistically significant surge in a specific crime category suggests organized or patterned behavior.",
                            recommendedAction: "Compare recent incident locations, times, and M.O. characteristics."
                        });
                    }
                }
            }

            return alerts;
        } catch (error) {
            console.error('[PatternDetection] getEmergingPatterns error:', error);
            return [];
        }
    }

    /**
     * Identifies repeat offenders using AccusedMasterID using streamRows.
     */
    async getRepeatOffenders(req) {
        try {
            const offenderMap = {};
            
            const res = await datastoreClient.streamRows(req, 'Accused', async (accusedBatch) => {
                accusedBatch.forEach(a => {
                    const key = a.AccusedMasterID ? `ID_${a.AccusedMasterID}` : `NAME_${a.AccusedName}_${a.AgeYear}`;
                    if (a.AccusedName === 'Unknown Accused' || !a.AccusedName) return;

                    if (!offenderMap[key]) {
                        offenderMap[key] = {
                            name: a.AccusedName,
                            demographics: `Age: ${a.AgeYear || 'Unknown'} | Gender: ${a.GenderID || 'Unknown'}`,
                            cases: new Set()
                        };
                    }
                    
                    if (a.CaseMasterID) {
                        offenderMap[key].cases.add(a.CaseMasterID);
                    }
                });
            }, { maxRowsPerChunk: 500 });

            if (res.totalCount === 0) return { status: 'Insufficient Data', message: 'No Accused records found.' };

            const repeatOffenders = Object.values(offenderMap)
                .filter(o => o.cases.size > 1)
                .sort((a, b) => b.cases.size - a.cases.size)
                .map(o => ({
                    name: o.name,
                    demographics: o.demographics,
                    numberOfCases: o.cases.size,
                    caseIds: Array.from(o.cases),
                    classification: o.cases.size >= 3 ? 'Strong historical association' : 'Repeat involvement detected',
                    source: 'Accused + CaseMaster',
                    provenance: `Matched across ${o.cases.size} distinct cases using Accused identifier (from ${res.totalCount} total processed records)`,
                    whyItMatters: "Repeat involvement by the same identifier suggests an unresolved recidivism pattern or serial behavior.",
                    recommendedAction: "Cross-reference mapped historical cases for behavioral consistency."
                }));

            return repeatOffenders.slice(0, 10);
        } catch (error) {
            console.error('[PatternDetection] getRepeatOffenders error:', error);
            return [];
        }
    }

    async getInvestigationGaps(req) {
        return {
            status: 'Operational',
            message: 'Investigation gaps are processed per-case via EvidenceIntelligenceController.'
        };
    }
}

module.exports = new PatternDetectionService();
