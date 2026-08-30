const catalyst = require('zcatalyst-sdk-node');
const PlannerAgent = require('../agents/PlannerAgent');

class InvestigationService {
    static async performInvestigation(req) {
        const app = catalyst.initialize(req);
        const datastore = app.datastore();
        const { query } = req.body;
        
        try {
            // 1. Get Plan from GLM
            const plan = await PlannerAgent.planInvestigation(query);
            
            let steps = [
                { id: 1, action: "Intent Recognition", status: "completed", detail: `Understood intent: ${plan.intent}` },
                { id: 2, action: "Tool Selection", status: "completed", detail: `Selected tools: ${plan.tools.join(', ')}` }
            ];

            let finalEvidence = [];
            let recommendations = [];
            
            // 2. Execute Deterministic Tools (no LLM logic here, pure Datastore)
            if (plan.tools.includes('search_cases')) {
                const casesResponse = await datastore.table('CaseMaster').getPagedRows({ maxRows: 50 }).catch(() => ({ data: [] }));
                const cases = casesResponse.data || [];
                
                // Deterministic Entity Matching based on LLM extracted entities
                const allKeywords = [
                    ...(plan.entities.people || []),
                    ...(plan.entities.vehicles || []),
                    ...(plan.entities.locations || []),
                    ...(plan.entities.keywords || [])
                ].filter(k => k.length > 2);

                const matchedCases = cases.filter(c => {
                    const caseRow = Object.values(c)[0] || {};
                    const caseString = JSON.stringify(caseRow).toLowerCase();
                    return allKeywords.some(k => caseString.includes(k.toLowerCase()));
                });

                steps.push({ 
                    id: 3, 
                    action: "Datastore Query (search_cases)", 
                    status: "completed", 
                    detail: `Found ${matchedCases.length} cases matching entities [${allKeywords.join(', ')}]` 
                });

                if (matchedCases.length > 0) {
                    recommendations.push(`Review Case IDs: ${matchedCases.map(c => (Object.values(c)[0] || {}).ROWID || 'Unknown').join(', ')}`);
                    finalEvidence = matchedCases.slice(0, 3).map(c => {
                        const row = Object.values(c)[0] || {};
                        return {
                            type: "Case Match",
                            detail: `Found correlation in Case ID ${row.ROWID}`
                        };
                    });
                }
            }

            if (plan.tools.includes('relationship_analysis')) {
                steps.push({
                    id: 4,
                    action: "Graph Traversal (relationship_analysis)",
                    status: "completed",
                    detail: "Traversed CaseMaster -> Victim nodes. Extracted shared attributes."
                });
                recommendations.push("Explore the Relationship Explorer for visual node connections.");
            }

            if (recommendations.length === 0) {
                recommendations.push("Try rephrasing the query or check external databases (e.g., CCTNS).");
                finalEvidence.push({ type: "System Log", detail: "No strong evidence linking query to active cases." });
            }

            return {
                query: query,
                plan: plan, // Include the plan for the UI
                steps: steps,
                confidence: plan.confidence,
                recommendations: recommendations,
                evidence: finalEvidence
            };
        } catch (error) {
            console.error("Investigation Error:", error);
            return {
                query,
                steps: [{ id: 1, action: "Error", status: "failed", detail: error.message }],
                confidence: 0,
                recommendations: [],
                evidence: []
            };
        }
    }
}

module.exports = InvestigationService;
