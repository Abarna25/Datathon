class RelationshipAgent {
    static async getNetwork(rawData, caseId) {
        const nodes = [];
        const edges = [];
        
        // Helper to add nodes without duplicates
        const addNode = (id, label, type, cluster, extraData = {}) => {
            if (!nodes.find(n => n.id === id)) {
                nodes.push({ id, label, type, cluster, ...extraData });
            }
        };

        const addEdge = (source, target, label, supportingEvidence = null) => {
            if (nodes.find(n => n.id === source) && nodes.find(n => n.id === target)) {
                if (!edges.find(e => e.source === source && e.target === target && e.label === label)) {
                    edges.push({ source, target, label, supportingEvidence });
                }
            }
        };



        // Real Data Graph builder - Cross-case Network Detection
        const cId = `case_${caseId}`;
        const mainCase = (rawData.cases || []).find(c => String(c.id) === String(caseId));
        if (mainCase) {
            addNode(cId, `Case #${mainCase.crimeNo || caseId}`, 'case', 'Center', {
                lat: mainCase.lat ? parseFloat(mainCase.lat) : null,
                lng: mainCase.lng ? parseFloat(mainCase.lng) : null
            });
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
                        addNode(caseNodeId, `Case #${c.crimeNo || c.id}`, 'case', 'Center', {
                            lat: c.lat ? parseFloat(c.lat) : null,
                            lng: c.lng ? parseFloat(c.lng) : null
                        });
                        addEdge(caseNodeId, suspectNodeId, 'Cross-Case Accused', `Suspect ${s.name} is also recorded as an accused in Case #${c.crimeNo || c.id}`);
                        networkClusters++;
                    } else {
                        addEdge(cId, suspectNodeId, 'Accused In', `Identified as primary suspect ${s.name} in this FIR.`);
                    }
                }
            });
        });

        // Add standard entities for the active case that weren't caught in the normalized cross-case net
        activeVictims.forEach((v, idx) => {
            if (idx >= 5) return; 
            const victimNodeId = `victim_${v.id}`;
            addNode(victimNodeId, v.name || `Victim #${v.id}`, 'victim', 'Left');
            addEdge(victimNodeId, cId, 'Victim In', `Recorded as victim ${v.name} in Case Master records.`);
        });

        activeWitnesses.forEach((w, idx) => {
            if (idx >= 5) return; 
            const witnessNodeId = `witness_${w.id}`;
            addNode(witnessNodeId, w.name || `Witness #${w.id}`, 'witness', 'BottomRight');
            addEdge(witnessNodeId, cId, 'Witness In', `Recorded as complainant/witness ${w.name} in Case Master records.`);
        });

        activeArrests.forEach(a => {
            const s = activeSuspects.find(sus => sus.id === a.accusedId);
            if (s) {
                const sName = String(s.name || '').toLowerCase().trim();
                const suspectNodeId = `suspect_norm_${sName.replace(/\s+/g, '_')}`;
                if (nodes.find(n => n.id === suspectNodeId)) {
                    addEdge(cId, suspectNodeId, a.type || 'Arrested', `Formal Arrest/Surrender record generated on ${a.date}`);
                }
            }
        });
        
        const activeCS = (rawData.chargesheets || []).filter(cs => String(cs.caseId) === String(caseId));
        activeCS.forEach(cs => {
            const csId = `cs_${cs.id}`;
            addNode(csId, `Chargesheet #${cs.id}`, 'document', 'Top');
            addEdge(csId, cId, 'Filed For', `Formal chargesheet submitted on ${cs.date} by Officer #${cs.officerId}`);
        });

        if (mainCase && mainCase.officerId) {
            const officerNodeId = `officer_${mainCase.officerId}`;
            addNode(officerNodeId, `Officer #${mainCase.officerId}`, 'police', 'BottomLeft');
            addEdge(officerNodeId, cId, 'Investigating', `Assigned Investigating Officer for Case #${caseId}`);
        }

        // --- Evidence Extraction for Extended Graph (Phones, Vehicles, Accounts, Locations, Events) ---
        const activeEvidence = (rawData.evidence || []).filter(e => String(e.caseId) === String(caseId));
        activeEvidence.forEach(e => {
            const desc = (e.description || '').toLowerCase();
            const eId = `ev_${e.id}`;
            const evidenceRef = `Evidence Record [${e.type || 'Physical'}]: ${e.description}`;
            
            // Try to deduce node type from description
            if (desc.includes('phone') || desc.includes('mobile') || desc.includes('call') || desc.includes('sim')) {
                addNode(eId, `Phone / Device`, 'phone', 'Right');
                addEdge(eId, cId, 'associated', evidenceRef);
                // Connect to a suspect if mentioned
                activeSuspects.forEach(s => {
                    if (desc.includes((s.name || '').toLowerCase())) {
                        const sNodeId = `suspect_norm_${(s.name||'').toLowerCase().trim().replace(/\s+/g, '_')}`;
                        addEdge(sNodeId, eId, 'owned', evidenceRef);
                        addEdge(sNodeId, eId, 'contacted', evidenceRef);
                    }
                });
            } else if (desc.includes('vehicle') || desc.includes('car') || desc.includes('bike') || desc.includes('registration')) {
                addNode(eId, `Vehicle`, 'vehicle', 'Left');
                addEdge(eId, cId, 'associated', evidenceRef);
            } else if (desc.includes('bank') || desc.includes('account') || desc.includes('transaction') || desc.includes('transfer')) {
                addNode(eId, `Financial Account`, 'account', 'Top');
                addEdge(eId, cId, 'associated', evidenceRef);
                // If it's a transfer
                if (desc.includes('transfer')) {
                    addNode(`${eId}_target`, `Recipient Account`, 'account', 'Top');
                    addEdge(eId, `${eId}_target`, 'transferred', evidenceRef);
                }
            } else if (desc.includes('organization') || desc.includes('company') || desc.includes('ltd')) {
                addNode(eId, `Organization`, 'organization', 'Bottom');
                addEdge(eId, cId, 'associated', evidenceRef);
            } else if (desc.includes('cctv') || desc.includes('footage') || desc.includes('event')) {
                addNode(eId, `Event / Footage`, 'event', 'Center');
                addEdge(eId, cId, 'witnessed', evidenceRef);
            } else {
                // Generic Evidence
                addNode(eId, `Evidence #${e.id}`, 'evidence', 'BottomRight');
                addEdge(eId, cId, 'mentioned', evidenceRef);
            }

            // Location
            if (e.location && e.location.trim() !== '') {
                const locId = `loc_${Buffer.from(e.location).toString('base64').substring(0, 10)}`;
                addNode(locId, e.location, 'location', 'BottomLeft');
                addEdge(eId, locId, 'visited', evidenceRef);
            }
        });

        // Network analysis insights attached to graph
        return { 
            nodes, 
            edges, 
            networkInsights: networkClusters > 0 ? `Detected a potential criminal network involving ${networkClusters} linked cases based on shared accused identities.` : 'No cross-case criminal network detected for this specific case.'
        };
    }
}

module.exports = RelationshipAgent;
