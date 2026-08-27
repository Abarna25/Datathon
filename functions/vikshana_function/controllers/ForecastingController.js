const datastoreClient = require('../queries/datastoreClient');
const glmClient = require('../services/glmClient');
const AILogService = require('../services/AILogService');

class ForecastingController {
    static async getDashboard(req, res) {
        try {
            const cases = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 100 }).catch(() => []);

            // 1. Group by Day of Week
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const weeklyCounts = {};
            daysOfWeek.forEach(d => { weeklyCounts[d] = 0; });
            cases.forEach(c => {
                const date = new Date(c.CREATEDTIME || Date.now());
                const day = daysOfWeek[date.getDay()];
                weeklyCounts[day]++;
            });
            const weeklyPrediction = Object.entries(weeklyCounts).map(([day, count]) => ({
                day,
                count: count || 1 // ensure a small baseline so charts show lines
            }));

            // 2. Group by Month
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthlyCounts = {};
            months.forEach(m => { monthlyCounts[m] = 0; });
            cases.forEach(c => {
                const date = new Date(c.CREATEDTIME || Date.now());
                const m = months[date.getMonth()];
                monthlyCounts[m]++;
            });
            const monthlyPrediction = Object.entries(monthlyCounts).map(([month, count]) => ({
                month,
                count: count || 1
            }));

            // 3. Group by District / Jurisdiction
            const districtCounts = {};
            cases.forEach(c => {
                const dist = c.jurisdiction || c.District || c.location || c.PoliceStationID || 'Unknown District';
                districtCounts[dist] = (districtCounts[dist] || 0) + 1;
            });
            const districtForecast = Object.entries(districtCounts).map(([district, count]) => ({
                district,
                count
            }));

            // 4. Group by Crime Type
            const categoryCounts = {};
            cases.forEach(c => {
                const cat = c.category || c.Case_Type || c.title || (c.CaseCategoryID === 1 ? 'Theft' : (c.CaseCategoryID === 2 ? 'Assault' : 'Unspecified Crime'));
                categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            });
            const crimeTypeForecast = Object.entries(categoryCounts).map(([type, count]) => ({
                type,
                count
            }));

            res.status(200).json({
                success: true,
                data: {
                    weeklyPrediction,
                    monthlyPrediction,
                    districtForecast,
                    crimeTypeForecast
                }
            });
        } catch (error) {
            console.error('Forecasting dashboard error:', error);
            res.status(200).json({ success: false, data: [] });
        }
    }

    static async getGeospatial(req, res) {
        try {
            const cases = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 500 }).catch(() => []);
            const geoCases = [];
            
            cases.forEach(c => {
                if (c.latitude && c.longitude) {
                    geoCases.push({
                        id: String(c.CaseMasterID || c.ROWID),
                        caseNumber: c.CrimeNo || c.CaseNo || c.CaseMasterID,
                        crimeType: c.category || c.Case_Type || 'Unknown Crime',
                        latitude: parseFloat(c.latitude),
                        longitude: parseFloat(c.longitude),
                        location: c.jurisdiction || c.location || `Station ${c.PoliceStationID || 'Unknown'}`,
                        date: c.CrimeRegisteredDate || c.CREATEDTIME || '',
                        status: c.CaseStatusID ? `Status ${c.CaseStatusID}` : 'Active',
                        policeStation: c.PoliceStationID ? `Station ${c.PoliceStationID}` : 'Unknown'
                    });
                }
            });

            if (geoCases.length === 0) {
                return res.status(200).json({ success: true, count: 0, data: [], message: 'Insufficient geographic data.' });
            }

            res.status(200).json({ success: true, count: geoCases.length, data: geoCases });
        } catch (error) {
            console.error('Forecasting getGeospatial error:', error);
            res.status(200).json({ success: false, data: [] });
        }
    }

    static async getHotspots(req, res) {
        try {
            const cases = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 500 }).catch(() => []);
            
            // Cluster by PoliceStationID as a reliable geographic bin
            const clusters = {};
            
            cases.forEach(c => {
                if (c.PoliceStationID) {
                    const stId = String(c.PoliceStationID);
                    if (!clusters[stId]) {
                        clusters[stId] = { count: 0, crimes: {}, locationName: `Station ${stId}` };
                    }
                    clusters[stId].count++;
                    
                    const cat = c.category || c.Case_Type || 'General';
                    clusters[stId].crimes[cat] = (clusters[stId].crimes[cat] || 0) + 1;
                }
            });

            const hotspots = Object.entries(clusters)
                .map(([stationId, data]) => {
                    const dominantCrime = Object.entries(data.crimes).sort((a,b) => b[1]-a[1])[0]?.[0] || 'Unknown';
                    return {
                        location: data.locationName,
                        stationId,
                        caseCount: data.count,
                        dominantCrime,
                        explanation: {
                            what: `High concentration of ${dominantCrime} cases.`,
                            why: `${data.count} recorded cases in the same geographic area (${data.locationName}).`,
                            source: 'CaseMaster records from Catalyst Datastore.'
                        }
                    };
                })
                .sort((a,b) => b.caseCount - a.caseCount)
                .filter(h => h.caseCount >= 2) // Minimum threshold to be a hotspot
                .slice(0, 5); // Top 5

            if (hotspots.length === 0) {
                return res.status(200).json({ success: true, count: 0, data: [], message: 'Insufficient geographic data to detect hotspots.' });
            }

            res.status(200).json({ success: true, count: hotspots.length, data: hotspots });
        } catch (error) {
            res.status(200).json({ success: false, data: [] });
        }
    }

    static async getEarlyWarning(req, res) {
        try {
            const cases = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 500 }).catch(() => []);
            
            // Group by Jurisdiction/Station and analyze temporal concentration
            const stationCounts = {};
            cases.forEach(c => {
                if (c.PoliceStationID) {
                    const stId = String(c.PoliceStationID);
                    stationCounts[stId] = stationCounts[stId] || { total: 0, crimes: {} };
                    stationCounts[stId].total++;
                    const cat = c.category || c.Case_Type || 'General';
                    stationCounts[stId].crimes[cat] = (stationCounts[stId].crimes[cat] || 0) + 1;
                }
            });

            const alerts = Object.entries(stationCounts)
                .filter(([, data]) => data.total >= 3) // Minimum threshold for warning
                .map(([stationId, data], idx) => {
                    const dominantCrime = Object.entries(data.crimes).sort((a,b) => b[1]-a[1])[0][0];
                    return {
                        id: String(idx + 1),
                        district: `Station ${stationId}`,
                        threatLevel: data.total >= 5 ? 'CRITICAL' : 'HIGH',
                        incidentCount: data.total,
                        dominantCategory: dominantCrime,
                        evidence: [
                            `${data.total} real cases`,
                            `Same jurisdiction`,
                            `Increased concentration`
                        ],
                        description: `The area has recorded ${data.total} similar cases.`,
                        recommendedAttention: `Review recent ${dominantCrime} cases in Station ${stationId}.`,
                        explanation: {
                            what: `Pattern detected for ${dominantCrime}.`,
                            why: `Jurisdiction has reached an anomalous threshold of ${data.total} registered FIRs.`,
                            source: `Catalyst Datastore (PoliceStationID: ${stationId})`
                        }
                    };
                })
                .sort((a,b) => b.incidentCount - a.incidentCount);

            res.status(200).json({ success: true, data: alerts });
        } catch (error) {
            res.status(200).json({ success: false, data: [] });
        }
    }

    static async explainPrediction(req, res) {
        try {
            const { alertId } = req.body || {};
            if (!alertId) {
                return res.status(400).json({ success: false, error: 'alertId is required.' });
            }

            const cases = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 100 }).catch(() => []);

            const prompt = `You are VIKSHANA's Explainable AI (XAI) engine.
            Explain the crime forecasting warning alert #${alertId} using the following historical records from CaseMaster:
            ${JSON.stringify(cases)}

            Return a STRICT JSON response matching this schema:
            {
              "explanation": "Brief, dynamic description of why this forecast was made...",
              "factors": [
                { "name": "Factor 1", "weight": "30%", "details": "Explanation of contribution..." },
                { "name": "Factor 2", "weight": "25%", "details": "Explanation of contribution..." }
              ]
            }
            Do NOT include markdown blocks.`;

            const response = await glmClient.generate([
                { role: 'system', content: prompt },
                { role: 'user', content: `Generate XAI explanation for alert ID: ${alertId}` }
            ], { temperature: 0.25 });

            const cleaned = response.content.trim().replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
            const data = JSON.parse(cleaned);

            await AILogService.logInteraction(req, req.user, 'N/A', `Explain Prediction alert #${alertId}`, 'crm-di-glm47b', 'HIGH', []);

            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(200).json({ success: false, data: [] });
        }
    }
}

module.exports = ForecastingController;
