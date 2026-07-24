const fs = require('fs');
const path = require('path');
const glmClient = require('./glmClient');
const datastoreClient = require('../queries/datastoreClient');

class TextToSQLService {
    constructor() {
        this.schemaContext = null;
    }

    getSchemaContext() {
        if (!this.schemaContext) {
            // Use the REAL Catalyst dataset schema — these are the only tables that exist
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

    async generateSQL(naturalLanguageQuery, caseId) {
        const schema = this.getSchemaContext();
        
        let promptAddition = '';
        if (caseId) {
            promptAddition = `\n7. The user is focusing on Case ID/ROWID: '${caseId}'. You MUST append a WHERE filter constraint to restrict findings to this case where appropriate (e.g. matching 'CaseMasterID = \\'${caseId}\\'').`;
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
5. If joining, note that ZCQL may have limited support for complex joins. Try to use simple joins or basic conditions.
6. Do NOT append semicolons (;) at the end of the query.
7. Use exact column names from the schema above — e.g. CaseMasterID (not case_id), AccusedName (not name), VictimName (not victim_name).${promptAddition}

Example User Query: Show all cases registered in 2021
Example Output: SELECT CaseMasterID, CrimeNo, BriefFacts, CrimeRegisteredDate FROM CaseMaster WHERE CrimeRegisteredDate LIKE '2021%'
`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: naturalLanguageQuery }
        ];

        const response = await glmClient.generate(messages, { temperature: 0.1 });
        const rawSql = response.content.trim().replace(/^```sql/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
        return rawSql.replace(/;$/, '');
    }

    validateSQL(sql) {
        const upperSql = sql.toUpperCase();
        
        // 1. Ensure it's a SELECT query
        if (!upperSql.startsWith('SELECT ')) {
            throw new Error('Only SELECT queries are allowed.');
        }

        // 2. Prevent forbidden keywords (SQL injection / dangerous operations)
        const forbiddenKeywords = ['UPDATE', 'DELETE', 'INSERT', 'DROP', 'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE', 'EXEC'];
        for (const keyword of forbiddenKeywords) {
            // Regex to match exact word boundary
            const regex = new RegExp(`\\b${keyword}\\b`);
            if (regex.test(upperSql)) {
                throw new Error(`Unsafe keyword detected: ${keyword}`);
            }
        }

        // 3. Ensure it references valid tables (basic check)
        // Additional advanced checks could go here
        
        return true;
    }

    async executeSQL(req, sql) {
        // Validation throws error if invalid
        this.validateSQL(sql);

        // Execute via standard datastoreClient
        // datastoreClient.query executes raw ZCQL
        try {
            const results = await datastoreClient.query(req, sql);
            
            // Unpack results. Usually they come like [ { CaseMaster: { id: ... } } ]
            // We'll flatten them based on the table name.
            const flattenedResults = results.map(row => {
                const keys = Object.keys(row);
                if (keys.length === 1 && typeof row[keys[0]] === 'object') {
                    // Extract table wrapper
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

    async explainResults(naturalLanguageQuery, sql, data) {
        const sampleData = data.slice(0, 5); // take max 5 records to limit context size
        
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
            const response = await glmClient.generate(messages, { temperature: 0.3 });
            return response.content.trim();
        } catch (error) {
            console.error('[TextToSQLService] Explanation generation failed:', error.message);
            return 'Explanation unavailable at this time.';
        }
    }
}

module.exports = new TextToSQLService();
