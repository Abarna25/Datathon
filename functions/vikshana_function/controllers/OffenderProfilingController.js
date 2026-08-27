const datastoreClient = require('../queries/datastoreClient');
const glmClient = require('../services/glmClient');
const AuditService = require('../services/AuditService');
const AILogService = require('../services/AILogService');

class OffenderProfilingController {
    static async getList(req, res) {
        try {
            const rows = await datastoreClient.getRows(req, 'Accused', { maxRows: 100 }).catch(() => []);
            
            // Group by AccusedName to find repeat offenders natively
            const accusedMap = {};
            rows.forEach(r => {
                const key = String(r.AccusedName || r.name || `Unknown-${r.ROWID}`).trim().toLowerCase();
                if (!accusedMap[key]) {
                    accusedMap[key] = {
                        id: String(r.AccusedMasterID || r.ROWID),
                        name: r.AccusedName || r.name || 'Unknown Accused',
                        alias: r.PersonID || 'None',
                        age: r.AgeYear || r.age || 'N/A',
                        gender: r.GenderID === 1 ? 'Male' : (r.GenderID === 2 ? 'Female' : 'Unknown'),
                        cases: new Set(),
                        records: []
                    };
                }
                if (r.CaseMasterID) accusedMap[key].cases.add(r.CaseMasterID);
                accusedMap[key].records.push(r);
            });

            const offenders = Object.values(accusedMap).map(o => {
                const totalCrimes = o.cases.size || 1;
                return {
                    id: o.id,
                    name: o.name,
                    alias: o.alias,
                    age: o.age,
                    gender: o.gender,
                    caseId: Array.from(o.cases)[0] || 'Unknown',
                    totalCrimes,
                    status: totalCrimes > 1 ? 'repeat_offender' : 'person_of_interest',
                    habitualTags: totalCrimes > 1 ? ['REPEAT_OFFENDER'] : [],
                    primaryCategory: 'Criminal Case',
                    riskScore: totalCrimes > 1 ? 85 : 50,
                    riskLevel: totalCrimes > 1 ? 'HIGH' : 'MEDIUM'
                };
            });

            res.status(200).json({ success: true, data: offenders });
        } catch (error) {
            console.error('Error in OffenderProfiling.getList:', error);
            res.status(200).json({ success: false, data: [] });
        }
    }

    static async getProfile(req, res) {
        try {
            const { id } = req.params;
            const row = await datastoreClient.getRowById(req, 'Accused', id);
            if (!row) {
                return res.status(404).json({ success: false, error: 'Accused not found' });
            }

            // Find all accused records matching this name to get full case history
            const name = String(row.AccusedName || '').trim();
            let allRecords = [row];
            if (name) {
                const sameNameRecords = await datastoreClient.getRowsWhere(req, 'Accused', { AccusedName: name }, { maxRows: 50 }).catch(() => []);
                if (sameNameRecords.length > 0) allRecords = sameNameRecords;
            }

            const caseIds = [...new Set(allRecords.map(r => r.CaseMasterID).filter(Boolean))];
            
            // Fetch real related cases
            const cases = await Promise.all(
                caseIds.map(cid => datastoreClient.getRowWhere(req, 'CaseMaster', { CaseMasterID: cid }).catch(() => null))
            ).then(results => results.filter(Boolean));

            const arrests = await Promise.all(
                caseIds.map(cid => datastoreClient.getRowsWhere(req, 'ArrestSurrender', { CaseMasterID: cid }).catch(() => []))
            ).then(results => results.flat());

            // Build evidence-based patterns
            const crimeTypes = [...new Set(cases.map(c => c.category || c.Case_Type || c.title).filter(Boolean))];
            const locations = [...new Set(cases.map(c => c.jurisdiction || c.District || c.location || c.PoliceStationID).filter(Boolean))];
            const totalCrimes = caseIds.length;

            const offender = {
                id: String(row.AccusedMasterID || row.ROWID),
                name: row.AccusedName || row.name || 'Unknown Accused',
                age: row.AgeYear || row.age || 'N/A',
                gender: row.GenderID === 1 ? 'Male' : (row.GenderID === 2 ? 'Female' : 'Unknown'),
                caseId: row.CaseMasterID,
                status: totalCrimes > 1 ? 'repeat_offender' : 'person_of_interest',
                habitualTags: totalCrimes > 1 ? ['REPEAT_OFFENDER'] : [],
                riskScore: totalCrimes > 1 ? 85 : 50,
                riskLevel: totalCrimes > 1 ? 'HIGH' : 'MEDIUM',
                riskExplanation: `Linked to ${totalCrimes} case(s). ${arrests.length} arrest/surrender record(s) found.`,
                contributingFactors: [
                    { factor: 'Linked Cases', weight: `${Math.min(totalCrimes * 25, 50)}%`, impact: totalCrimes > 1 ? 'CRITICAL' : 'MEDIUM' },
                    { factor: 'Arrest Records', weight: `${Math.min(arrests.length * 25, 50)}%`, impact: arrests.length > 1 ? 'HIGH' : 'LOW' }
                ],
                masterProfile: {
                    fullName: row.AccusedName || 'Unknown',
                    aliases: [row.PersonID || 'None'],
                    criminalId: `CRIM-${row.AccusedMasterID || row.ROWID}`,
                    caseId: row.CaseMasterID
                },
                crimeStatsDetailed: {
                    totalCrimes: totalCrimes,
                    arrests: arrests.length,
                    recurringCrimeTypes: crimeTypes.length > 0 ? crimeTypes : ['Data unavailable'],
                    recurringLocations: locations.length > 0 ? locations : ['Data unavailable'],
                    primaryCategory: crimeTypes[0] || 'Criminal Case'
                },
                chronologicalTimeline: arrests.map(a => ({
                    date: a.ArrestSurrenderDate || 'Unknown Date',
                    event: a.ArrestSurrenderTypeID === 1 ? 'Arrested' : 'Surrendered',
                    detail: `Case ${a.CaseMasterID || 'N/A'}, Station ${a.PoliceStationID || 'N/A'}`
                }))
            };

            await AuditService.logEvent(req, req.user, 'Viewed Accused Profile', `Accused:${row.AccusedMasterID || row.ROWID}`, String(row.CaseMasterID || ''), 'SUCCESS');
            res.status(200).json({ success: true, data: offender });
        } catch (error) {
            console.error('Error in OffenderProfiling.getProfile:', error);
            res.status(200).json({ success: false, data: [] });
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
            res.status(200).json({ success: false, data: [] });
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

            CRITICAL RULES:
            1. Do NOT make psychological diagnoses.
            2. Do NOT infer unsupported personality traits.
            3. Only produce evidence-based criminological indicators (like recurring locations, MO, or timeline gaps).
            4. If data is insufficient to answer the question, state that data is unavailable.

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
            res.status(200).json({ success: false, data: [] });
        }
    }
}

module.exports = OffenderProfilingController;
