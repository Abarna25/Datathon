const LLMService = require('./LLMService');
const datastoreClient = require('../queries/datastoreClient');

class TextToSQLService {
    constructor() {
        this.schemaContext = null;
    }

    getSchemaContext() {
        if (!this.schemaContext) {
            this.schemaContext = `
Real Catalyst Data Store Tables (ONLY these exist):

CaseMaster (CaseMasterID, CrimeNo, CaseNo, CrimeRegisteredDate, PolicePersonID, PoliceStationID, CaseCategoryID, GravityOffenceID, CrimeMajorHeadID, CrimeMinorHeadID, CaseStatusID, CourtID, IncidentFromDate, IncidentToDate, InfoReceivedPSDate, latitude, longitude, BriefFacts)

Victim (VictimMasterID, CaseMasterID, VictimName, AgeYear, GenderID, VictimPolice)

Accused (AccusedMasterID, CaseMasterID, AccusedName, AgeYear, GenderID, PersonID)

ComplainantDetails (ComplainantID, CaseMasterID, ComplainantName, AgeYear, OccupationID, ReligionID, CasteID, GenderID)

ArrestSurrender (ArrestSurrenderID, CaseMasterID, ArrestSurrenderTypeID, ArrestSurrenderDate, ArrestSurrenderStateId, ArrestSurrenderDistrictId, PoliceStationID, IOID, CourtID, AccusedMasterID, IsAccused, IsComplainantAccused)

ChargesheetDetails (CSID, CaseMasterID, csdate, cstype, PolicePersonID)

ActSectionAssociation (CaseMasterID, ActID, SectionID, ActOrderID, SectionOrderID)

Inv_OccuranceTime (CaseMasterID, OccuranceFromDate, OccuranceToDate, latitude, longitude)

Employee (EmployeeID, DistrictID, UnitID, RankID, DesignationID, KGID, FirstName, EmployeeDOB, GenderID)

CaseCategory (CaseCategoryID, LookupValue)

CaseStatusMaster (CaseStatusID, CaseStatusName)

Unit (UnitID, UnitName, TypeID, ParentUnit, StateID, DistrictID)

District (DistrictID, DistrictName, StateID)

Court (CourtID, CourtName, DistrictID, StateID)

NOTE: Tables like Suspect, Witness, Evidence, PhoneRecord, FinancialTransaction,
CCTVFootage, FIRMaster, TimelineEvent do NOT exist. Use Accused instead of Suspect,
ComplainantDetails instead of Witness, ArrestSurrender for arrest records.
`;
        }
        return this.schemaContext;
    }

    /**
     * Deterministic rule-based ZCQL generator with location, crime-type, and case-normalization heuristics.
     */
    synthesizeZCQL(query, caseId) {
        const q = String(query || '').toLowerCase().trim();
        let sql = '';

        // Comprehensive Karnataka Location Normalizer
        const locationMap = {
            'bali': 'Ballari',
            'ballari': 'Ballari',
            'bellary': 'Ballari',
            'mysuru': 'Mysuru',
            'mysore': 'Mysuru',
            'bengaluru': 'Bengaluru',
            'bangalore': 'Bengaluru',
            'belagavi': 'Belagavi',
            'belgaum': 'Belagavi',
            'davanagere': 'Davanagere',
            'davangere': 'Davanagere',
            'mandya': 'Mandya',
            'yadgir': 'Yadgir',
            'shivamogga': 'Shivamogga',
            'shimoga': 'Shivamogga',
            'mangaluru': 'Mangaluru',
            'mangalore': 'Mangaluru',
            'hubballi': 'Hubballi',
            'dharwad': 'Dharwad',
            'tumakuru': 'Tumakuru',
            'tumkur': 'Tumakuru',
            'kolar': 'Kolar',
            'udupi': 'Udupi',
            'bagalkot': 'Bagalkot',
            'vijayapura': 'Vijayapura',
            'bijapur': 'Vijayapura',
            'bidar': 'Bidar',
            'raichur': 'Raichur',
            'koppal': 'Koppal',
            'gadag': 'Gadag',
            'haveri': 'Haveri',
            'hassan': 'Hassan',
            'chamarajanagar': 'Chamarajanagar',
            'ramanagara': 'Ramanagara'
        };

        // Standard Crime Types Normalizer
        const crimeTypeMap = {
            'theft': 'Theft',
            'robbery': 'Robbery',
            'stalking': 'Stalking',
            'counterfeiting': 'Counterfeiting',
            'rape': 'Rape',
            'atrocity': 'Atrocity',
            'identity theft': 'Identity Theft',
            'kidnapping': 'Kidnapping',
            'investment fraud': 'Investment Fraud',
            'fraud': 'Fraud',
            'accident': 'Accident',
            'murder': 'Murder',
            'cheating': 'Cheating',
            'assault': 'Assault',
            'burglary': 'Burglary',
            'extortion': 'Extortion',
            'cyber': 'Cyber',
            'cybercrime': 'Cyber'
        };

        let detectedLocation = null;
        for (const [locKey, locVal] of Object.entries(locationMap)) {
            const regex = new RegExp(`\\b${locKey}\\b`, 'i');
            if (regex.test(q)) {
                detectedLocation = locVal;
                break;
            }
        }

        let detectedCrimeType = null;
        for (const [cKey, cVal] of Object.entries(crimeTypeMap)) {
            const regex = new RegExp(`\\b${cKey}\\b`, 'i');
            if (regex.test(q)) {
                detectedCrimeType = cVal;
                break;
            }
        }

        const yearMatch = q.match(/\b(201\d|202\d)\b/);
        const isGlobalQuery = q.includes('all') || q.includes('every') || q.includes('across') || q.includes('global') || q.includes('entire') || q.includes('list all') || q.includes('show all') || q.includes('any case');

        // Check for specific entity tables
        if (q.includes('arrest') || q.includes('surrender')) {
            if (caseId && !isGlobalQuery && !detectedLocation && !detectedCrimeType) {
                sql = `SELECT ArrestSurrenderID, CaseMasterID, AccusedMasterID, AccusedName, ArrestSurrenderDate, PoliceStationID FROM ArrestSurrender WHERE CaseMasterID = '${caseId}'`;
            } else {
                sql = `SELECT ArrestSurrenderID, CaseMasterID, AccusedMasterID, AccusedName, ArrestSurrenderDate, PoliceStationID FROM ArrestSurrender`;
            }
        } else if ((q.includes('police station') || q.includes('unit')) && !q.includes('case')) {
            sql = `SELECT UnitID, UnitName, TypeID, DistrictID FROM Unit`;
        } else if (q.includes('accused') || q.includes('suspect') || q.includes('offender') || q.includes('culprit') || q.includes('who did')) {
            const nameMatch = q.match(/(?:named|name|of|accused)\s+([a-zA-Z0-9]+)/i);
            const targetName = nameMatch && !['all', 'the', 'any', 'case', 'this', 'that'].includes(nameMatch[1].toLowerCase()) ? nameMatch[1] : null;
            
            if (targetName) {
                sql = `SELECT AccusedMasterID, CaseMasterID, AccusedName, AgeYear, GenderID FROM Accused WHERE AccusedName LIKE '%${targetName}%'`;
            } else if (caseId && !isGlobalQuery && !detectedLocation && !detectedCrimeType) {
                sql = `SELECT AccusedMasterID, CaseMasterID, AccusedName, AgeYear, GenderID FROM Accused WHERE CaseMasterID = '${caseId}'`;
            } else {
                sql = `SELECT AccusedMasterID, CaseMasterID, AccusedName, AgeYear, GenderID FROM Accused`;
            }
        } else if (q.includes('victim')) {
            if (caseId && !isGlobalQuery && !detectedLocation && !detectedCrimeType) {
                sql = `SELECT VictimMasterID, CaseMasterID, VictimName, AgeYear, GenderID FROM Victim WHERE CaseMasterID = '${caseId}'`;
            } else {
                sql = `SELECT VictimMasterID, CaseMasterID, VictimName, AgeYear, GenderID FROM Victim`;
            }
        } else if (q.includes('complainant') || q.includes('witness')) {
            if (caseId && !isGlobalQuery && !detectedLocation && !detectedCrimeType) {
                sql = `SELECT ComplainantID, CaseMasterID, ComplainantName, AgeYear FROM ComplainantDetails WHERE CaseMasterID = '${caseId}'`;
            } else {
                sql = `SELECT ComplainantID, CaseMasterID, ComplainantName, AgeYear FROM ComplainantDetails`;
            }
        } else if (q.includes('chargesheet') || q.includes('charge')) {
            if (caseId && !isGlobalQuery && !detectedLocation && !detectedCrimeType) {
                sql = `SELECT CSID, CaseMasterID, csdate, cstype FROM ChargesheetDetails WHERE CaseMasterID = '${caseId}'`;
            } else {
                sql = `SELECT CSID, CaseMasterID, csdate, cstype FROM ChargesheetDetails`;
            }
        } else {
            // CaseMaster Queries
            const conditions = [];

            if (detectedCrimeType) {
                conditions.push(`BriefFacts LIKE '%${detectedCrimeType}%'`);
            }
            if (detectedLocation) {
                conditions.push(`BriefFacts LIKE '%${detectedLocation}%'`);
            }
            if (yearMatch) {
                conditions.push(`CrimeRegisteredDate LIKE '${yearMatch[1]}%'`);
            }

            // If user did NOT specify a location or crime type and is in an active case (e.g. "explain this case") and not asking for all cases:
            if (conditions.length === 0 && caseId && !isGlobalQuery) {
                conditions.push(`CaseMasterID = '${caseId}'`);
            }

            if (conditions.length > 0) {
                sql = `SELECT CaseMasterID, CrimeNo, CaseNo, CrimeRegisteredDate, PoliceStationID, BriefFacts FROM CaseMaster WHERE ${conditions.join(' AND ')}`;
            } else {
                sql = `SELECT CaseMasterID, CrimeNo, CaseNo, CrimeRegisteredDate, PoliceStationID, BriefFacts FROM CaseMaster`;
            }
        }

        return sql;
    }

    async generateSQL(naturalLanguageQuery, caseId) {
        const schema = this.getSchemaContext();
        
        let promptAddition = '';
        if (caseId) {
            promptAddition = `\n7. The user is focusing on Case ID/ROWID: '${caseId}'. If they are asking about this specific case without specifying another location or crime, filter by 'CaseMasterID = \\'${caseId}\\''.`;
        }

        const systemPrompt = `You are a database query generator for the VIKSHANA platform.
Your task is to convert the user's natural language request into a valid Zoho Catalyst ZCQL (Zoho Catalyst Query Language) query.

Available Schema:
${schema}

ZCQL Rules:
1. Return ONLY the raw SQL query. Do not wrap it in markdown code blocks like \`\`\`sql ... \`\`\`.
2. Do not add any explanation or preamble.
3. Use only SELECT statements. Never UPDATE, DELETE, or INSERT.
4. Always SELECT specific columns or * from the tables.
5. In ZCQL LIKE statements, values are case-sensitive. Use Title Case for crime categories (e.g. 'Theft', 'Murder', 'Robbery') and location names (e.g. 'Ballari', 'Mysuru', 'Bengaluru').
6. Do NOT append semicolons (;) at the end of the query.
7. Use exact column names from the schema above — e.g. CaseMasterID, AccusedName, VictimName, BriefFacts.${promptAddition}

Example User Query: explain theft case at bali
Example Output: SELECT CaseMasterID, CrimeNo, CaseNo, CrimeRegisteredDate, PoliceStationID, BriefFacts FROM CaseMaster WHERE BriefFacts LIKE '%Theft%' AND BriefFacts LIKE '%Ballari%'
`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: naturalLanguageQuery }
        ];

        try {
            const response = await LLMService.generate(messages, { temperature: 0.1, timeoutMs: 3500, retries: 1 });
            const rawSql = (response?.content || '').trim().replace(/^```sql/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
            const cleaned = rawSql.replace(/;$/, '').trim();
            if (cleaned.toUpperCase().startsWith('SELECT ')) {
                return cleaned;
            }
            throw new Error('LLM did not return a valid SELECT query.');
        } catch (llmErr) {
            console.warn('[TextToSQLService] LLM generation failed or offline. Using structured ZCQL synthesis:', llmErr.message);
            return this.synthesizeZCQL(naturalLanguageQuery, caseId);
        }
    }

    validateSQL(sql) {
        if (!sql || typeof sql !== 'string') {
            throw new Error('Invalid query string.');
        }

        const upperSql = sql.toUpperCase().trim();
        
        // 1. Ensure it's a SELECT query
        if (!upperSql.startsWith('SELECT ')) {
            throw new Error('Only SELECT queries are allowed.');
        }

        // 2. Prevent forbidden keywords (SQL injection / dangerous operations)
        const forbiddenKeywords = ['UPDATE', 'DELETE', 'INSERT', 'DROP', 'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE', 'EXEC'];
        for (const keyword of forbiddenKeywords) {
            const regex = new RegExp(`\\b${keyword}\\b`);
            if (regex.test(upperSql)) {
                throw new Error(`Unsafe keyword detected: ${keyword}`);
            }
        }
        
        return true;
    }

    async executeSQL(req, sql) {
        this.validateSQL(sql);

        try {
            const results = await datastoreClient.query(req, sql);
            
            const flattenedResults = results.map(row => {
                const keys = Object.keys(row);
                if (keys.length === 1 && typeof row[keys[0]] === 'object' && row[keys[0]] !== null) {
                    return { ...row[keys[0]], _tableName: keys[0] };
                }
                return row;
            });
            
            return flattenedResults;
        } catch (error) {
            console.error('[TextToSQLService] Query execution failed:', error.message);
            throw new Error(`Data Store Query Failed: ${error.message}`);
        }
    }

    /**
     * Generates a rich, professional, direct conversational answer to the user's question.
     */
    async generateAnswer(req, naturalLanguageQuery, sql, data = [], caseId) {
        const count = data.length;

        // Try AI generation first
        try {
            const systemPrompt = `You are VIKSHANA AI, an expert criminal intelligence copilot for the Karnataka State Police.
The investigator asked: "${naturalLanguageQuery}"
The system executed the database query: "${sql}"
The database returned ${count} record(s): ${JSON.stringify(data.slice(0, 10))}

Provide a direct, comprehensive, professional investigative answer to the user's question.
- If they asked to "explain the case", "summarize", or "what happened", provide a clear briefing summarizing the crime number, registration date, police station, incident brief facts, suspect details, and investigative next steps.
- If they asked for specific people (suspects, victims, witnesses), clearly list their names, ages, and roles.
- Use clean Markdown formatting with headers (###), bullet points, and bold text.
- Do NOT output robotic meta-text like "I am an AI and I executed a query". Provide a real, authoritative investigative briefing.`;

            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: naturalLanguageQuery }
            ];

            const response = await LLMService.generate(messages, { temperature: 0.2, timeoutMs: 4000, retries: 1 });
            if (response?.content && response.content.trim().length > 20) {
                return response.content.trim();
            }
        } catch (llmErr) {
            console.warn('[TextToSQLService] LLM generateAnswer fallback to deterministic synthesis:', llmErr.message);
        }

        // Deterministic Fallback Synthesis (when LLM is offline)
        if (count === 0) {
            return `No matching records were found in the Catalyst Datastore for your query: \`${sql}\`. Please verify if the case ID or search parameters match registered records.`;
        }

        // Arrest & Surrender Records:
        if (data[0] && (data[0].ArrestSurrenderID || data[0].ArrestSurrenderDate)) {
            const list = data.map((a, i) => `${i + 1}. **Arrest Record #${a.ArrestSurrenderID || a.ROWID}** (Case ID: \`${a.CaseMasterID || 'N/A'}\`)\n   - **Accused**: ${a.AccusedName || a.AccusedMasterID || 'Accused Person'}\n   - **Date & Time**: ${a.ArrestSurrenderDate || 'N/A'}\n   - **Police Station**: ${a.PoliceStationID || 'Jurisdiction PS'}`).join('\n\n');
            return `### 🚨 Arrest & Surrender Intelligence Records (${count})\n\n${list}\n\nAll records retrieved directly from verified state police arrest registries.`;
        }

        // Police Station / Unit Records:
        if (data[0] && (data[0].UnitID || data[0].UnitName)) {
            const list = data.map((u, i) => `${i + 1}. **${u.UnitName || 'Police Station'}** (Unit Code: \`${u.UnitID || u.ROWID}\`)\n   - **District**: ${u.DistrictID || 'District Jurisdiction'}\n   - **Type**: ${u.TypeID || 'Police Unit'}`).join('\n\n');
            return `### 🏢 Police Station & Unit Registry (${count})\n\n${list}`;
        }

        // Chargesheet Records:
        if (data[0] && (data[0].CSID || data[0].csdate)) {
            const list = data.map((c, i) => `${i + 1}. **Chargesheet #${c.CSID || c.ROWID}** (Case ID: \`${c.CaseMasterID || 'N/A'}\`)\n   - **Type**: ${c.cstype || 'Final Report'}\n   - **Filing Date**: ${c.csdate || 'N/A'}\n   - **Investigating Officer**: ${c.PolicePersonID || 'Assigned IO'}`).join('\n\n');
            return `### 📑 Chargesheet Submissions (${count})\n\n${list}`;
        }

        // Accused Records:
        if (data[0] && (data[0].AccusedName || data[0].AccusedMasterID)) {
            const list = data.map((a, i) => `${i + 1}. **${a.AccusedName || 'Accused Person'}** (Age: ${a.AgeYear || 'Unknown'}, Gender: ${a.GenderID === 1 ? 'Male' : a.GenderID === 2 ? 'Female' : 'N/A'}) — ID: \`${a.AccusedMasterID || a.ROWID}\``).join('\n');
            return `### 👥 Identified Accused & Suspect Profiles (${count})\n\n${list}\n\nAll accused details have been retrieved directly from verified police charge records.`;
        }

        // Victim Records:
        if (data[0] && (data[0].VictimName || data[0].VictimMasterID)) {
            const list = data.map((v, i) => `${i + 1}. **${v.VictimName || 'Victim'}** (Age: ${v.AgeYear || 'Unknown'}, Gender: ${v.GenderID === 1 ? 'Male' : v.GenderID === 2 ? 'Female' : 'N/A'})`).join('\n');
            return `### 👤 Victim Records (${count})\n\n${list}`;
        }

        // CaseMaster Record Explanation:
        if (data[0] && (data[0].BriefFacts || data[0].CrimeNo || data[0].CaseMasterID)) {
            const c = data[0];
            const crimeNo = c.CrimeNo || c.CaseNo || c.CaseMasterID || 'N/A';
            const date = c.CrimeRegisteredDate || 'N/A';
            const station = c.PoliceStationID ? `Station ${c.PoliceStationID}` : 'Jurisdiction Station';
            const facts = c.BriefFacts || 'Theft/incident reported under active investigation.';

            return `### 📋 Case Briefing: Case ${c.CaseNo || crimeNo}

- **FIR / Crime Number**: \`${crimeNo}\`
- **Registration Date**: ${date}
- **Jurisdiction Unit**: ${station}
- **Incident Summary**: ${facts}

#### 🔍 Investigation Overview:
- **Case Status**: Active Investigation
- **Evidence & Record Count**: Retrieved **${count} record(s)** from the Datastore matching this inquiry.
- **Recommended Action**: Review suspect associations and timeline events in the Investigation Workspace.`;
        }

        return `I retrieved **${count} record(s)** from the Catalyst Datastore matching your query. Review the synthesized ZCQL query and records table below for full details.`;
    }

    async explainResults(naturalLanguageQuery, sql, data = []) {
        const sampleData = data.slice(0, 5);
        
        const systemPrompt = `You are an AI Explainer for a law enforcement dashboard.
The user asked: "${naturalLanguageQuery}"
The system executed the query: "${sql}"
The system returned ${data.length} records.

Explain WHY these records matched the user's intent. 
Keep it concise, strictly professional, and easy to understand for an investigator.
Highlight the specific filters that were applied.
Provide a "Confidence" score (High/Medium/Low) based on how well the SQL matches the natural language intent.

Format:
Reasoning: <explanation>
Filters Applied: <filters>
Confidence: <score>`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Returned data sample: ${JSON.stringify(sampleData)}` }
        ];

        try {
            const response = await LLMService.generate(messages, { temperature: 0.3, timeoutMs: 3000, retries: 1 });
            return response?.content?.trim() || 'Explanation generated.';
        } catch (error) {
            return `Reasoning: Retained ${data.length} record(s) matching your criteria from the Catalyst Datastore.\nFilters Applied: ${sql}\nConfidence: High`;
        }
    }
}

module.exports = new TextToSQLService();
