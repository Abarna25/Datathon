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

        // Determine empty graph context. If less than 5 entities, generate realistic demo map
        let totalEntities = 
            (rawData.victims?.length || 0) + 
            (rawData.suspects?.length || 0) + 
            (rawData.witnesses?.length || 0) + 
            (rawData.arrests?.length || 0);

        if (totalEntities < 5) {
            // Generate the specialized Demo Map requested for the active case
            const cId = `C_${caseId}`;
            addNode(cId, `Case #${caseId}`, 'case', 'Center');

            // Victims
            addNode('V_1', 'Victim 1', 'victim', 'Left');
            addNode('V_2', 'Victim 2', 'victim', 'Left');
            addEdge('V_1', cId, 'Victim In');
            addEdge('V_2', cId, 'Victim In');

            // Accused
            addNode('A_1', 'Suspect (Prime)', 'suspect', 'Right');
            addNode('A_2', 'Accomplice', 'suspect', 'Right');
            addNode('A_3', 'Lookout', 'suspect', 'Right');
            addEdge(cId, 'A_1', 'Accused In');
            addEdge(cId, 'A_2', 'Accused In');
            addEdge(cId, 'A_3', 'Accused In');

            // Witnesses
            addNode('W_1', 'Shopkeeper', 'witness', 'BottomRight');
            addNode('W_2', 'Passerby', 'witness', 'BottomRight');
            addNode('W_3', 'Neighbor', 'witness', 'BottomRight');
            addNode('W_4', 'Security Guard', 'witness', 'BottomRight');
            addNode('W_5', 'Driver', 'witness', 'BottomRight');
            addEdge('W_1', cId, 'Witness In');
            addEdge('W_2', cId, 'Witness In');
            addEdge('W_3', cId, 'Witness In');
            addEdge('W_4', cId, 'Witness In');
            addEdge('W_5', cId, 'Witness In');

            // Police
            addNode('P_1', 'Insp. Rajesh', 'police', 'BottomLeft');
            addNode('P_2', 'SI Ramesh', 'police', 'BottomLeft');
            addNode('P_3', 'Constable Kumar', 'police', 'BottomLeft');
            addEdge('P_1', cId, 'Investigating');
            addEdge('P_2', cId, 'Investigating');
            addEdge('P_3', cId, 'Investigating');

            // Evidence
            addNode('E_1', 'CCTV Footage', 'evidence', 'Top');
            addNode('E_2', 'Blood Sample', 'evidence', 'Top');
            addNode('E_3', 'Fingerprints', 'evidence', 'Top');
            addNode('E_4', 'Transaction Log', 'evidence', 'Top');
            addNode('E_5', 'Fibers', 'evidence', 'Top');

            // Weapons
            addNode('Wep_1', 'Knife', 'weapon', 'Right');
            addNode('Wep_2', 'Iron Rod', 'weapon', 'Right');
            addNode('Wep_3', 'Pistol', 'weapon', 'Right');
            addEdge('Wep_1', 'A_1', 'Recovered From');
            addEdge('Wep_2', 'A_2', 'Recovered From');
            addEdge('Wep_3', 'A_1', 'Recovered From');

            // Vehicles
            addNode('Veh_1', 'SUV White', 'vehicle', 'UpperRight');
            addNode('Veh_2', 'Motorcycle', 'vehicle', 'UpperRight');
            addNode('Veh_3', 'Van', 'vehicle', 'UpperRight');
            addNode('Veh_4', 'Scooter', 'vehicle', 'UpperRight');
            addNode('Veh_5', 'Truck', 'vehicle', 'UpperRight');
            addEdge('Veh_1', 'A_1', 'Used By');
            addEdge('Veh_2', 'A_2', 'Used By');
            addEdge('Veh_3', 'A_3', 'Used By');
            addEdge('Veh_4', 'A_1', 'Used By');
            addEdge('Veh_5', 'A_2', 'Used By');

            // Phones
            addNode('Ph_1', '9876543210', 'phone', 'LowerRight');
            addNode('Ph_2', '9998887776', 'phone', 'LowerRight');
            addNode('Ph_3', '9112223334', 'phone', 'LowerRight');
            addNode('Ph_4', '9888777666', 'phone', 'LowerRight');
            addNode('Ph_5', '9777666555', 'phone', 'LowerRight');
            addEdge('Ph_1', 'A_1', 'Belongs To');
            addEdge('Ph_2', 'A_2', 'Belongs To');
            addEdge('Ph_3', 'A_3', 'Belongs To');
            addEdge('Ph_4', 'A_1', 'Belongs To');
            addEdge('Ph_5', 'A_2', 'Belongs To');

            // Locations
            addNode('L_1', 'Crime Scene', 'location', 'UpperLeft');
            addNode('L_2', 'Hideout', 'location', 'UpperLeft');
            addNode('L_3', 'Hotel', 'location', 'UpperLeft');
            addNode('L_4', 'Toll Plaza', 'location', 'UpperLeft');
            addNode('L_5', 'Warehouse', 'location', 'UpperLeft');
            addEdge('E_1', 'L_1', 'Collected From');
            addEdge('E_2', 'L_1', 'Collected From');
            addEdge('E_3', 'L_2', 'Collected From');
            addEdge('E_4', 'L_3', 'Collected From');
            addEdge('E_5', 'L_5', 'Collected From');

            return { nodes, edges };
        }

        // Real Data Graph builder
        const cId = `case_${caseId}`;
        const caseRecord = (rawData.cases || []).find(c => String(c.id) === String(caseId));
        addNode(cId, `Case #${caseRecord?.crimeNo || caseId}`, 'case', 'Center');

        // Victims
        (rawData.victims || []).forEach((v, idx) => {
            if (idx >= 5) return; // Limit 5
            const victimNodeId = `victim_${v.id}`;
            addNode(victimNodeId, v.name || `Victim #${v.id}`, 'victim', 'Left');
            addEdge(victimNodeId, cId, 'Victim In');
        });

        // Suspects
        (rawData.suspects || []).forEach((s, idx) => {
            if (idx >= 8) return; // Limit 8
            const suspectNodeId = `suspect_${s.id}`;
            addNode(suspectNodeId, s.name || `Suspect #${s.id}`, 'suspect', 'Right');
            addEdge(cId, suspectNodeId, 'Accused In');
        });

        // Witnesses
        (rawData.witnesses || []).forEach((w, idx) => {
            if (idx >= 5) return; // Limit 5
            const witnessNodeId = `witness_${w.id}`;
            addNode(witnessNodeId, w.name || `Witness #${w.id}`, 'witness', 'BottomRight');
            addEdge(witnessNodeId, cId, 'Witness In');
        });

        // Arrests (Mapped as edges or attributes)
        (rawData.arrests || []).forEach(a => {
            const suspectNodeId = `suspect_${a.accusedId}`;
            if (nodes.find(n => n.id === suspectNodeId)) {
                addEdge(cId, suspectNodeId, a.type || 'Arrested');
            }
        });
        
        // Chargesheets
        (rawData.chargesheets || []).forEach(cs => {
            const csId = `cs_${cs.id}`;
            addNode(csId, `Chargesheet #${cs.id}`, 'document', 'Top');
            addEdge(csId, cId, 'Filed For');
        });

        // Ensure police officers are added if case has them
        if (caseRecord && caseRecord.officerId) {
            const officerNodeId = `officer_${caseRecord.officerId}`;
            addNode(officerNodeId, `Officer #${caseRecord.officerId}`, 'police', 'BottomLeft');
            addEdge(officerNodeId, cId, 'Investigating');
        }

        return { nodes, edges };
    }
}

module.exports = RelationshipAgent;
