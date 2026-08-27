class RelationshipAgent {
    static async getNetwork(rawData, caseId) {
        const nodes = [];
        const edges = [];
        
        // Helper to add nodes without duplicates
        const addNode = (id, label, type, cluster) => {
            if (!nodes.find(n => n.id === id)) {
                nodes.push({ id, label, type, cluster });
            }
        };

        const addEdge = (source, target, label) => {
            if (nodes.find(n => n.id === source) && nodes.find(n => n.id === target)) {
                if (!edges.find(e => e.source === source && e.target === target && e.label === label)) {
                    edges.push({ source, target, label });
                }
            }
        };



        // Real Data Graph builder - Cross-case Network Detection
        const cId = `case_${caseId}`;
        const mainCase = (rawData.cases || []).find(c => String(c.id) === String(caseId));
        if (mainCase) {
            addNode(cId, `Case #${mainCase.crimeNo || caseId}`, 'case', 'Center');
        }

        const activeSuspects = (rawData.suspects || []).filter(s => String(s.caseId) === String(caseId));
        const activeVictims = (rawData.victims || []).filter(v => String(v.caseId) === String(caseId));
        const activeWitnesses = (rawData.witnesses || []).filter(w => String(w.caseId) === String(caseId));

        // Create sets of names to trace cross-case connections
        const suspectNames = new Set(activeSuspects.map(s => String(s.name || '').toLowerCase().trim()).filter(n => n.length > 2));
        
        let networkClusters = 0;

        // Process all cases to find intersections
        (rawData.cases || []).forEach(c => {
            const currentCaseId = String(c.id);
            const caseNodeId = `case_${currentCaseId}`;
            
            // Check if this case shares any suspects
            const caseSuspects = (rawData.suspects || []).filter(s => String(s.caseId) === currentCaseId);
            
            let shared = false;
            caseSuspects.forEach(s => {
                const sName = String(s.name || '').toLowerCase().trim();
                if (suspectNames.has(sName)) {
                    shared = true;
                    // It's a repeat offender across cases!
                    const suspectNodeId = `suspect_norm_${sName.replace(/\s+/g, '_')}`;
                    addNode(suspectNodeId, s.name, 'suspect', 'Right'); // Highly connected node
                    
                    // Link case to this central suspect
                    if (currentCaseId !== String(caseId)) {
                        addNode(caseNodeId, `Case #${c.crimeNo || c.id}`, 'case', 'Center');
                        addEdge(caseNodeId, suspectNodeId, 'Cross-Case Accused');
                        networkClusters++;
                    } else {
                        addEdge(cId, suspectNodeId, 'Accused In');
                    }
                }
            });
        });

        // Add standard entities for the active case that weren't caught in the normalized cross-case net
        activeVictims.forEach((v, idx) => {
            if (idx >= 5) return; 
            const victimNodeId = `victim_${v.id}`;
            addNode(victimNodeId, v.name || `Victim #${v.id}`, 'victim', 'Left');
            addEdge(victimNodeId, cId, 'Victim In');
        });

        activeWitnesses.forEach((w, idx) => {
            if (idx >= 5) return; 
            const witnessNodeId = `witness_${w.id}`;
            addNode(witnessNodeId, w.name || `Witness #${w.id}`, 'witness', 'BottomRight');
            addEdge(witnessNodeId, cId, 'Witness In');
        });

        const activeArrests = (rawData.arrests || []).filter(a => String(a.caseId) === String(caseId));
        activeArrests.forEach(a => {
            const s = activeSuspects.find(sus => sus.id === a.accusedId);
            if (s) {
                const sName = String(s.name || '').toLowerCase().trim();
                const suspectNodeId = `suspect_norm_${sName.replace(/\s+/g, '_')}`;
                if (nodes.find(n => n.id === suspectNodeId)) {
                    addEdge(cId, suspectNodeId, a.type || 'Arrested');
                }
            }
        });
        
        const activeCS = (rawData.chargesheets || []).filter(cs => String(cs.caseId) === String(caseId));
        activeCS.forEach(cs => {
            const csId = `cs_${cs.id}`;
            addNode(csId, `Chargesheet #${cs.id}`, 'document', 'Top');
            addEdge(csId, cId, 'Filed For');
        });

        if (mainCase && mainCase.officerId) {
            const officerNodeId = `officer_${mainCase.officerId}`;
            addNode(officerNodeId, `Officer #${mainCase.officerId}`, 'police', 'BottomLeft');
            addEdge(officerNodeId, cId, 'Investigating');
        }

        // Network analysis insights attached to graph
        return { 
            nodes, 
            edges, 
            networkInsights: networkClusters > 0 ? `Detected a potential criminal network involving ${networkClusters} linked cases based on shared accused identities.` : 'No cross-case criminal network detected for this specific case.'
        };
    }
}

module.exports = RelationshipAgent;
