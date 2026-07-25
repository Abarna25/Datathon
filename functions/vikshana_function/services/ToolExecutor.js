const datastoreClient = require('../queries/datastoreClient');

class ToolExecutor {
    /**
     * Executes the tools requested by the Planner against Catalyst DataStore deterministically.
     * @param {Object} plan - The structured JSON plan from PlannerAgent
     * @param {Object} req - The express request object for Catalyst SDK initialization
     * @returns {Promise<Object>} The combined results of all executed tools
     */
    async executePlan(plan, req) {
        const results = {};
        const toolsToRun = plan.tools || [];
        const entities = plan.entities || {};
        
        console.log(`[ToolExecutor] Executing plan for intent: ${plan.intent}. Tools: ${toolsToRun.join(', ')}`);

        // Resolve Case IDs from entities if present
        const caseIds = [...(entities.case_ids || []), ...(entities.keywords || []).filter(k => !isNaN(parseInt(k)))];

        for (const toolName of toolsToRun) {
            try {
                switch (toolName) {
                    case 'search_cases':
                        results[toolName] = await this._searchCases(req, entities, caseIds);
                        break;
                    case 'search_victims':
                        results[toolName] = await this._searchVictims(req, entities, caseIds);
                        break;
                    case 'search_accused':
                        results[toolName] = await this._searchAccused(req, entities, caseIds);
                        break;
                    case 'search_arrests':
                        results[toolName] = await this._searchArrests(req, caseIds);
                        break;
                    case 'relationship_analysis':
                        results[toolName] = await this._relationshipAnalysis(req, caseIds);
                        break;
                    case 'timeline_analysis':
                        results[toolName] = await this._timelineAnalysis(req, caseIds);
                        break;
                    default:
                        console.warn(`[ToolExecutor] Unknown tool requested: ${toolName}`);
                        results[toolName] = { status: 'unsupported_tool' };
                }
            } catch (error) {
                console.error(`[ToolExecutor] Error executing tool '${toolName}':`, error.message);
                results[toolName] = { error: error.message };
            }
        }

        return results;
    }

    async _searchCases(req, entities, caseIds) {
        const cases = [];
        // Direct ID lookup
        for (const cid of caseIds) {
            try {
                const caseRow = await datastoreClient.getRowById(req, 'CaseMaster', cid);
                if (caseRow) cases.push(caseRow);
            } catch (e) { /* ignore missing */ }
        }

        // If no direct IDs but we have keywords, do a broad fetch and filter (simulated search)
        if (cases.length === 0 && (entities.keywords?.length > 0 || entities.locations?.length > 0)) {
            const allCases = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 50 });
            const terms = [...(entities.keywords || []), ...(entities.locations || [])].map(t => t.toLowerCase());
            for (const c of allCases) {
                const str = JSON.stringify(c).toLowerCase();
                if (terms.some(t => str.includes(t))) cases.push(c);
            }
        }
        
        return cases;
    }

    async _searchVictims(req, entities, caseIds) {
        const victims = [];
        for (const cid of caseIds) {
            const res = await datastoreClient.getRowsByCase(req, 'Victim', cid);
            victims.push(...res);
        }
        return victims;
    }

    async _searchAccused(req, entities, caseIds) {
        const accused = [];
        for (const cid of caseIds) {
            const res = await datastoreClient.getRowsByCase(req, 'Accused', cid);
            accused.push(...res);
        }
        return accused;
    }

    async _searchArrests(req, caseIds) {
        const arrests = [];
        for (const cid of caseIds) {
            const res = await datastoreClient.getRowsByCase(req, 'ArrestSurrender', cid);
            arrests.push(...res);
        }
        return arrests;
    }

    async _relationshipAnalysis(req, caseIds) {
        if (caseIds.length === 0) return { error: "Case ID required for relationship analysis" };
        
        const relationships = [];
        for (const cid of caseIds) {
            const [victims, accused, witnesses] = await Promise.all([
                datastoreClient.getRowsByCase(req, 'Victim', cid),
                datastoreClient.getRowsByCase(req, 'Accused', cid),
                datastoreClient.getRowsByCase(req, 'ComplainantDetails', cid)
            ]);
            relationships.push({ caseId: cid, victims, accused, witnesses });
        }
        return relationships;
    }

    async _timelineAnalysis(req, caseIds) {
        if (caseIds.length === 0) return { error: "Case ID required for timeline analysis" };
        
        const timeline = [];
        for (const cid of caseIds) {
            const [occurrences, arrests] = await Promise.all([
                datastoreClient.getRowsByCase(req, 'Inv_OccuranceTime', cid),
                datastoreClient.getRowsByCase(req, 'ArrestSurrender', cid)
            ]);
            timeline.push({ caseId: cid, occurrences, arrests });
        }
        return timeline;
    }
}

module.exports = new ToolExecutor();
