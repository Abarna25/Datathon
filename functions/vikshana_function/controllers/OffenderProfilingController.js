const datastoreClient = require('../queries/datastoreClient');
const glmClient = require('../services/glmClient');
const AuditService = require('../services/AuditService');
const AILogService = require('../services/AILogService');

class OffenderProfilingController {
    static async getList(req, res) {
        try {
            // Real table: Accused (was 'Suspect' which does not exist in dataset)
            const rows = await datastoreClient.getRows(req, 'Accused', { maxRows: 100 }).catch(() => []);
            const offenders = rows.map(r => ({
                id: String(r.AccusedMasterID || r.ROWID),
                name: r.AccusedName || r.name || 'Unknown Accused',
                alias: r.PersonID || 'None',
                age: r.AgeYear || r.age || 'N/A',
                gender: r.GenderID === 1 ? 'Male' : r.GenderID === 2 ? 'Female' : 'Unknown',
                caseId: r.CaseMasterID,
                riskScore: 65,
                riskLevel: 'MEDIUM',
                status: 'person_of_interest',
                habitualTags: [],
                primaryCategory: 'Criminal Case',
                totalCrimes: 1
            }));
            res.status(200).json({ success: true, data: offenders });
        } catch (error) {
            console.error('Error in OffenderProfiling.getList:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getProfile(req, res) {
        try {
            const { id } = req.params;
            // Real table: Accused (was 'Suspect')
            const row = await datastoreClient.getRowById(req, 'Accused', id);
            if (!row) {
                return res.status(404).json({ success: false, error: 'Accused not found' });
            }

            // Also fetch arrest records for this accused
            const arrests = await datastoreClient.getRowsWhere(req, 'ArrestSurrender', { AccusedMasterID: row.AccusedMasterID || id }, { maxRows: 10 }).catch(() => []);

            const offender = {
                id: String(row.AccusedMasterID || row.ROWID),
                name: row.AccusedName || row.name || 'Unknown Accused',
                age: row.AgeYear || row.age || 'N/A',
                gender: row.GenderID === 1 ? 'Male' : row.GenderID === 2 ? 'Female' : 'Unknown',
                caseId: row.CaseMasterID,
                status: 'person_of_interest',
                habitualTags: arrests.length > 1 ? ['REPEAT_OFFENDER'] : [],
                riskScore: arrests.length > 1 ? 80 : 55,
                riskLevel: arrests.length > 1 ? 'HIGH' : 'MEDIUM',
                riskExplanation: `Accused in case ${row.CaseMasterID}. ${arrests.length} arrest/surrender record(s) found.`,
                contributingFactors: [
                    { factor: 'Arrest Records', weight: `${Math.min(arrests.length * 25, 75)}%`, impact: arrests.length > 1 ? 'CRITICAL' : 'MEDIUM' }
                ],
                masterProfile: {
                    fullName: row.AccusedName || 'Unknown',
                    aliases: [row.PersonID || 'None'],
                    criminalId: `CRIM-${row.AccusedMasterID || row.ROWID}`,
                    caseId: row.CaseMasterID
                },
                crimeStatsDetailed: {
                    totalCrimes: arrests.length || 1,
                    arrests: arrests.length,
                    primaryCategory: 'Criminal Case (India Police Dataset)'
                },
                chronologicalTimeline: arrests.map(a => ({
                    date: a.ArrestSurrenderDate || 'Unknown',
                    event: a.ArrestSurrenderTypeID === 1 ? 'Arrested' : 'Surrendered',
                    detail: `At Police Station ${a.PoliceStationID || 'N/A'}`
                }))
            };

            await AuditService.logEvent(req, req.user, 'Viewed Accused Profile', `Accused:${row.AccusedMasterID || row.ROWID}`, String(row.CaseMasterID || ''), 'SUCCESS');
            res.status(200).json({ success: true, data: offender });
        } catch (error) {
            console.error('Error in OffenderProfiling.getProfile:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async compareOffenders(req, res) {
        try {
            const { id1, id2 } = req.params;
            const [offender1, offender2] = await Promise.all([
                datastoreClient.getRowById(req, 'Accused', id1),
                datastoreClient.getRowById(req, 'Accused', id2)
            ]);

            if (!offender1 || !offender2) {
                return res.status(404).json({ success: false, error: 'One or both accused not found.' });
            }

            const prompt = `You are a Senior Criminology Expert comparing suspects.
            Perform a modus operandi (MO) and risk comparison between:
            Suspect 1: ${JSON.stringify(offender1)}
            Suspect 2: ${JSON.stringify(offender2)}

            Return a STRICT JSON response matching this schema:
            {
              "similarityScore": "85%",
              "sharedMo": ["Shared entry method", "Shared getaway strategy"],
              "sharedVictims": ["Target profile matching..."],
              "sharedLocations": ["Precinct / District matching..."],
              "sharedAssociates": ["Shared gang or associate name"]
            }
            Do NOT include markdown blocks.`;

            const resGLM = await glmClient.generate([
                { role: 'system', content: prompt },
                { role: 'user', content: 'Compare offenders.' }
            ], { temperature: 0.2 });

            const cleaned = resGLM.content.trim().replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
            const data = JSON.parse(cleaned);

            res.status(200).json({
                success: true,
                data: {
                    offender1: { id: offender1.ROWID, name: offender1.name, riskScore: offender1.risk_level === 'high' ? 88 : 55, district: 'Sector 18' },
                    offender2: { id: offender2.ROWID, name: offender2.name, riskScore: offender2.risk_level === 'high' ? 88 : 55, district: 'Sector 18' },
                    ...data
                }
            });
        } catch (error) {
            console.error('Error in compareOffenders:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async askAIInsights(req, res) {
        try {
            const { offenderId, question } = req.body;
            if (!offenderId || !question) {
                return res.status(400).json({ success: false, error: 'offenderId and question are required.' });
            }

            // Real table: Accused
            const offender = await datastoreClient.getRowById(req, 'Accused', offenderId);
            if (!offender) {
                return res.status(404).json({ success: false, error: 'Accused not found.' });
            }

            const prompt = `You are a Senior Offender Profiling Expert.
            Answer the question about this suspect: "${question}"
            Suspect Record: ${JSON.stringify(offender)}

            Return a STRICT JSON response matching this schema:
            {
              "answer": "Detailed analysis...",
              "confidence": "HIGH | MEDIUM | LOW",
              "reasoning": ["Step 1 of reasoning", "Step 2 of reasoning"],
              "evidence": ["Evidence 1", "Evidence 2"],
              "supportingRecords": ["Record 1"]
            }
            Do NOT include markdown blocks.`;

            const resGLM = await glmClient.generate([
                { role: 'system', content: prompt },
                { role: 'user', content: question }
            ], { temperature: 0.3 });

            const cleaned = resGLM.content.trim().replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
            const responseData = JSON.parse(cleaned);

            await AILogService.logInteraction(req, req.user, offender.CaseMasterID, question, 'crm-di-glm47b', responseData.confidence, []);

            res.status(200).json({ success: true, data: responseData });
        } catch (error) {
            console.error('Error in askAIInsights:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = OffenderProfilingController;
