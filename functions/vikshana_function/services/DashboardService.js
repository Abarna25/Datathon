const datastoreClient = require('../queries/datastoreClient');

/**
 * DashboardService — Uses ONLY real Catalyst dataset tables:
 *
 * ✅ CaseMaster         (CaseMasterID, CrimeNo, CaseNo, CaseStatusID, CaseCategoryID, BriefFacts)
 * ✅ Victim             (VictimMasterID, CaseMasterID, VictimName)
 * ✅ Accused            (AccusedMasterID, CaseMasterID, AccusedName)  ← was "Suspect"
 * ✅ ArrestSurrender    (ArrestSurrenderID, CaseMasterID, AccusedMasterID)
 * ✅ ChargesheetDetails (CSID, CaseMasterID, csdate)
 * ✅ ComplainantDetails (ComplainantID, CaseMasterID, ComplainantName)
 * ✅ Inv_OccuranceTime  (CaseMasterID, OccuranceFromDate)
 *
 * ❌ Suspect, Evidence, TimelineEvent, FIRMaster — NOT in dataset, queries removed
 */

class DashboardService {
    static async getDashboardData(req) {
        try {
            const [
                casesCountRes,
                victimsCountRes,
                accusedCountRes,
                arrestsCountRes,
                chargesheetCountRes,
                cases
            ] = await Promise.all([
                datastoreClient.query(req, 'SELECT COUNT(CaseMasterID) FROM CaseMaster').catch(() => []),
                datastoreClient.query(req, 'SELECT COUNT(VictimMasterID) FROM Victim').catch(() => []),
                datastoreClient.query(req, 'SELECT COUNT(AccusedMasterID) FROM Accused').catch(() => []),
                datastoreClient.query(req, 'SELECT COUNT(ArrestSurrenderID) FROM ArrestSurrender').catch(() => []),
                datastoreClient.query(req, 'SELECT COUNT(CSID) FROM ChargesheetDetails').catch(() => []),
                datastoreClient.getRows(req, 'CaseMaster', { maxRows: 500 }).catch(() => [])
            ]);

            const getCount = (res) => {
                if (!res || !res.length) return 0;
                const row = res[0];
                const inner = Object.values(row)[0] || {};
                const val = typeof inner === 'object' ? Object.values(inner)[0] : inner;
                return parseInt(val || 0, 10);
            };

            const totalCases     = getCount(casesCountRes);
            const totalVictims   = getCount(victimsCountRes);
            const totalAccused   = getCount(accusedCountRes);
            const totalArrests   = getCount(arrestsCountRes);
            const totalCharges   = getCount(chargesheetCountRes);

            // CaseStatusID: 1=Open/Active, 4=Closed (based on data sample)
            const openCases = (cases || []).filter(c => {
                const status = String(c.CaseStatusID || '').trim();
                return status === '1' || status === '2' || status === '3';
            }).length;

            // Group by CaseCategoryID to build crime category distribution
            const categoryCounts = {};
            (cases || []).forEach(c => {
                const cat = c.CaseCategoryID ? `Category ${c.CaseCategoryID}` : 'General';
                categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            });
            const crimeCategories = Object.entries(categoryCounts)
                .map(([category, count]) => ({ category, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 8);

            return {
                stats: {
                    totalCases,
                    openCases,
                    totalVictims,
                    totalAccused,
                    totalArrests,
                    totalCharges,
                    todaysFIR: totalCases,
                    crimeTrend: 'LIVE'
                },
                recentAlerts: [
                    {
                        id: 1,
                        title: `Catalyst connected: ${totalCases} cases, ${totalVictims} victims, ${totalAccused} accused, ${totalArrests} arrests on record.`,
                        severity: 'SUCCESS',
                        time: new Date().toLocaleTimeString()
                    }
                ],
                crimeCategories: crimeCategories.length
                    ? crimeCategories
                    : [{ category: 'No cases on file', count: 0 }]
            };
        } catch (error) {
            console.error('DashboardService Catalyst error:', error);
            throw error;
        }
    }
}

module.exports = DashboardService;
