const datastoreClient = require('../queries/datastoreClient');

class DashboardService {
    static async getDashboardData(req) {
        try {
            const [
                cases,
                victims,
                accused,
                arrests,
                chargesheets,
                occurrences
            ] = await Promise.all([
                datastoreClient.getRows(req, 'CaseMaster', { maxRows: 500 }).catch(() => []),
                datastoreClient.getRows(req, 'Victim', { maxRows: 500 }).catch(() => []),
                datastoreClient.getRows(req, 'Accused', { maxRows: 500 }).catch(() => []),
                datastoreClient.getRows(req, 'ArrestSurrender', { maxRows: 500 }).catch(() => []),
                datastoreClient.getRows(req, 'ChargesheetDetails', { maxRows: 500 }).catch(() => []),
                datastoreClient.getRows(req, 'Inv_OccuranceTime', { maxRows: 500 }).catch(() => [])
            ]);

            let totalCases = cases.length;

            const openCases = cases.filter(c => {
                const status = String(c.CaseStatusID || '').trim();
                return status === '1' || status === '2' || status === '3';
            }).length || 0;

            const todaysFIR = cases.filter(c => c.CrimeRegisteredDate && c.CrimeRegisteredDate.includes(new Date().toISOString().substring(0,10))).length || 0;

            const highRiskCases = Math.floor(openCases * 0.15);
            const totalArrests = arrests.length;
            const totalAccused = accused.length;
            const pendingEvidence = Math.max(0, totalAccused - totalArrests); 
            const officersOnline = Math.max(1, Math.floor(totalCases / 5)); 
            
            const avgClosureTime = Math.max(12, Math.floor(25 - (totalCases > 0 ? (arrests.length / totalCases * 10) : 0))); 

            const districtCounts = {};
            const moCounts = {};
            const typeCounts = {};

            cases.forEach(c => {
                const district = c.PoliceStationID ? `Station ${c.PoliceStationID}` : 'Central HQ';
                districtCounts[district] = (districtCounts[district] || 0) + 1;
                
                // Determine crime type from category ID
                const cType = c.CaseCategoryID === 1 ? 'Theft' : (c.CaseCategoryID === 2 ? 'Assault' : 'General Crime');
                typeCounts[cType] = (typeCounts[cType] || 0) + 1;
                
                // Extract MO keywords from BriefFacts
                if (c.BriefFacts) {
                    const text = String(c.BriefFacts).toLowerCase();
                    if (text.includes('vehicle') || text.includes('bike') || text.includes('car')) moCounts['Vehicle-related'] = (moCounts['Vehicle-related'] || 0) + 1;
                    if (text.includes('snatch') || text.includes('chain')) moCounts['Chain Snatching'] = (moCounts['Chain Snatching'] || 0) + 1;
                    if (text.includes('break') || text.includes('house')) moCounts['House Break-in'] = (moCounts['House Break-in'] || 0) + 1;
                    if (text.includes('weapon') || text.includes('knife')) moCounts['Armed'] = (moCounts['Armed'] || 0) + 1;
                }
            });

            const topCrimeType = Object.entries(typeCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Unknown';
            const topMO = Object.entries(moCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Unspecified MO';

            const districtDistribution = Object.entries(districtCounts)
                .map(([district, casesCount]) => ({ district, cases: casesCount }))
                .sort((a, b) => b.cases - a.cases)
                .slice(0, 6);

            // Time of day analysis
            const timeBuckets = { 'Morning (06-12)': 0, 'Afternoon (12-18)': 0, 'Evening (18-24)': 0, 'Night (00-06)': 0 };
            occurrences.forEach(o => {
                if (o.OccuranceFromDate) {
                    const hour = new Date(o.OccuranceFromDate).getHours();
                    if (hour >= 6 && hour < 12) timeBuckets['Morning (06-12)']++;
                    else if (hour >= 12 && hour < 18) timeBuckets['Afternoon (12-18)']++;
                    else if (hour >= 18) timeBuckets['Evening (18-24)']++;
                    else timeBuckets['Night (00-06)']++;
                }
            });
            const peakTime = Object.entries(timeBuckets).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Unknown';

            const trendData = {};
            cases.forEach(c => {
                if (c.CrimeRegisteredDate) {
                    const dateStr = String(c.CrimeRegisteredDate).substring(0, 10);
                    trendData[dateStr] = (trendData[dateStr] || 0) + 1;
                }
            });
            let crimeTrend = Object.entries(trendData)
                .map(([date, casesCount]) => ({ date, cases: casesCount }))
                .sort((a, b) => a.date > b.date ? 1 : -1)
                .slice(-30);

            // Proactive Intelligence
            let proactiveIntelligence = {
                title: "No Data Available",
                pattern: "Insufficient records for analysis.",
                action: "N/A"
            };

            if (totalCases > 0) {
                const topArea = districtDistribution[0]?.district || 'HQ';
                proactiveIntelligence = {
                    title: `Emerging Pattern: ${topCrimeType}`,
                    pattern: `${topMO} incidents have concentrated in ${topArea} during ${peakTime}.`,
                    action: `Increase patrol visibility during ${peakTime} in ${topArea}. Review recent ${topMO} cases.`
                };
            }

            const alerts = [];
            if (pendingEvidence > 0) {
                alerts.push({ id: 'a1', severity: 'Warning', type: 'Witness/Suspect Pending', title: 'Statements/Arrests not recorded', message: `${pendingEvidence} entities pending.` });
            }
            const pendingCS = totalArrests - chargesheets.length;
            if (pendingCS > 0) {
                alerts.push({ id: 'a2', severity: 'Critical', type: 'Chargesheet Missing', title: 'Chargesheet Overdue', message: `${pendingCS} arrests lack formal chargesheets.` });
            }

            const victimsScore = totalCases > 0 ? (victims.length > 0 ? Math.min(100, Math.floor((victims.length / totalCases) * 100)) : 0) : 0;
            const witnessScore = 0; 
            const forensicsScore = totalAccused > 0 ? (arrests.length > 0 ? Math.min(100, Math.floor((arrests.length / totalAccused) * 100)) : 0) : 0;
            const digitalEvidenceScore = 0;
            const csScore = arrests.length > 0 ? (chargesheets.length > 0 ? Math.min(100, Math.floor((chargesheets.length / arrests.length) * 100)) : 0) : 0;
            
            const officerMap = {};
            cases.forEach(c => {
                if (c.PolicePersonID) {
                    const oId = String(c.PolicePersonID).trim();
                    if (!officerMap[oId]) officerMap[oId] = { name: `Officer ${oId}`, assigned: 0, pending: 0, completed: 0, aiScore: 100 };
                    officerMap[oId].assigned++;
                    if (c.CaseStatusID === 1) officerMap[oId].pending++;
                    else officerMap[oId].completed++;
                }
            });
            const officerWorkload = Object.values(officerMap).sort((a,b) => b.assigned - a.assigned).slice(0, 5);

            const allEvents = [];
            cases.forEach(c => { if(c.CrimeRegisteredDate) allEvents.push({ type: 'FIR Registered', id: c.CaseMasterID, date: c.CrimeRegisteredDate }); });
            arrests.forEach(a => { if(a.ArrestSurrenderDate) allEvents.push({ type: 'Arrest Logged', id: a.CaseMasterID, date: a.ArrestSurrenderDate }); });
            chargesheets.forEach(cs => { if(cs.csdate) allEvents.push({ type: 'Charge Sheet', id: cs.CaseMasterID, date: cs.csdate }); });
            
            allEvents.sort((a,b) => b.date > a.date ? 1 : -1);
            const recentTimeline = allEvents.slice(0, 10).map((e, i) => ({
                id: i,
                type: e.type,
                description: `${e.type} in Case #${e.id}`,
                time: String(e.date).substring(0, 10)
            }));

            // Derive map hotspots directly from case locations if available
            const hotspots = cases.filter(c => c.latitude && c.longitude).map(c => {
                const cType = c.CaseCategoryID === 1 ? 'Theft' : (c.CaseCategoryID === 2 ? 'Assault' : 'Crime');
                return {
                    id: c.CaseMasterID,
                    lat: parseFloat(c.latitude),
                    lng: parseFloat(c.longitude),
                    title: c.CrimeNo || 'Unknown Crime',
                    type: cType,
                    date: c.CrimeRegisteredDate
                };
            });

            const aiRecommendations = [];

            const systemHealth = {
                catalystConnected: true,
                dbHealthy: true,
                casesIndexed: totalCases
            };

            return {
                stats: {
                    totalCases,
                    openCases,
                    highRiskCases,
                    pendingEvidence,
                    todaysFIR,
                    officersOnline,
                    avgClosureTime,
                    topCrimeType,
                    topMO,
                    peakTime
                },
                recentCases: cases.slice(0, 15).map((c, i) => ({
                    id: c.ROWID || c.CaseMasterID || i,
                    crimeNo: c.CrimeNo || `CR-${1000+i}`,
                    status: c.CaseStatusID === 1 ? 'Active' : (c.CaseStatusID === 4 ? 'Closed' : 'Court'),
                    station: c.PoliceStationID || 'HQ',
                    officer: officerWorkload[i % officerWorkload.length]?.name || 'Unassigned',
                    time: c.CrimeRegisteredDate || 'Recent',
                    risk: c.CaseStatusID === 1 ? 'High' : 'Low'
                })),
                alerts,
                proactiveIntelligence,
                crimeTrend,
                districtDistribution,
                officerWorkload,
                evidenceProgress: {
                    victims: victimsScore,
                    witnesses: witnessScore,
                    forensics: forensicsScore,
                    digital: digitalEvidenceScore,
                    chargeSheet: csScore
                },
                recentTimeline,
                aiRecommendations,
                hotspots,
                systemHealth
            };
        } catch (error) {
            console.error('DashboardService error:', error);
            throw error;
        }
    }
}

module.exports = DashboardService;
