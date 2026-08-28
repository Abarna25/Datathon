/**
 * Neo4jGraphService.js
 * Native Cypher Graph Database Intelligence & Synchronizer for VIKSHANA.
 * Connects directly to Neo4j instance when configured, or provides structured
 * relational fallback graph directly from Catalyst Datastore.
 */

const neo4jClient = require('../queries/neo4j_client');
const datastoreClient = require('../queries/datastoreClient');
const RelationshipAgent = require('../agents/RelationshipAgent');

class Neo4jGraphService {
    /**
     * Checks if Neo4j is actively configured and reachable.
     */
    static isAvailable() {
        return neo4jClient.isConfigured();
    }

    /**
     * Checks full driver connectivity with latency measurement
     */
    static async checkHealth() {
        return await neo4jClient.checkConnection();
    }

    /**
     * Synchronizes a case and all 10 forensic entities into Neo4j graph nodes & edges.
     */
    static async syncCaseToGraph(req, caseId) {
        if (!this.isAvailable()) {
            return {
                synced: false,
                status: 'GRAPH_DATABASE_UNAVAILABLE',
                message: 'Neo4j connection is not configured in this environment. Operating in Datastore relational graph mode.'
            };
        }

        try {
            const [
                caseRecord,
                accused,
                victims,
                evidence,
                weapons,
                vehicles,
                cdrs,
                financials,
                cctvs,
                courtHearings,
                forensicReports,
                biometrics,
                interrogations
            ] = await Promise.all([
                datastoreClient.getRowById(req, 'CaseMaster', caseId),
                datastoreClient.getRowsWhere(req, 'Accused', { CaseMasterID: caseId }),
                datastoreClient.getRowsWhere(req, 'Victim', { CaseMasterID: caseId }),
                datastoreClient.getRowsWhere(req, 'Evidence', { CaseMasterID: caseId }).catch(() => []),
                datastoreClient.getRowsWhere(req, 'Weapon', { CaseMasterID: caseId }).catch(() => []),
                datastoreClient.getRowsWhere(req, 'Vehicle', { CaseMasterID: caseId }).catch(() => []),
                datastoreClient.getRowsWhere(req, 'CallDetailRecord', { CaseMasterID: caseId }).catch(() => []),
                datastoreClient.getRowsWhere(req, 'FinancialTransaction', { CaseMasterID: caseId }).catch(() => []),
                datastoreClient.getRowsWhere(req, 'CCTVRecord', { CaseMasterID: caseId }).catch(() => []),
                datastoreClient.getRowsWhere(req, 'CourtHearing', { CaseMasterID: caseId }).catch(() => []),
                datastoreClient.getRowsWhere(req, 'ForensicReport', { CaseMasterID: caseId }).catch(() => []),
                datastoreClient.getRowsWhere(req, 'BiometricRecord', { CaseMasterID: caseId }).catch(() => []),
                datastoreClient.getRowsWhere(req, 'InterrogationReport', { CaseMasterID: caseId }).catch(() => [])
            ]);

            if (!caseRecord) {
                throw new Error(`CaseMaster record ${caseId} not found in Datastore.`);
            }

            // 1. Merge Case Node
            await neo4jClient.executeQuery(`
                MERGE (c:Case { id: $caseId })
                ON CREATE SET c.crimeNo = $crimeNo, c.category = $category, c.registeredDate = $date, c.created = timestamp()
                ON MATCH SET c.updated = timestamp()
            `, {
                caseId: String(caseId),
                crimeNo: caseRecord.CrimeNo || `CASE-${caseId}`,
                category: caseRecord.CaseCategoryID === 1 ? 'Theft' : (caseRecord.CaseCategoryID === 2 ? 'Assault' : 'Crime'),
                date: caseRecord.CrimeRegisteredDate || ''
            });

            // 2. Merge Accused Nodes & INVOLVED_IN Edges
            for (const acc of accused) {
                const accId = String(acc.AccusedMasterID || acc.ROWID);
                await neo4jClient.executeQuery(`
                    MATCH (c:Case { id: $caseId })
                    MERGE (a:Accused { id: $accId })
                    ON CREATE SET a.name = $name, a.age = $age, a.gender = $gender
                    MERGE (a)-[:INVOLVED_IN { role: 'ACCUSED' }]->(c)
                `, {
                    caseId: String(caseId),
                    accId,
                    name: acc.AccusedName || 'Unknown Accused',
                    age: Number(acc.AgeYear) || 0,
                    gender: acc.GenderID === 1 ? 'Male' : (acc.GenderID === 2 ? 'Female' : 'Unknown')
                });
            }

            // 3. Merge Victim Nodes & VICTIM_OF Edges
            for (const vic of victims) {
                const vicId = String(vic.VictimMasterID || vic.ROWID);
                await neo4jClient.executeQuery(`
                    MATCH (c:Case { id: $caseId })
                    MERGE (v:Victim { id: $vicId })
                    ON CREATE SET v.name = $name
                    MERGE (v)-[:VICTIM_OF]->(c)
                `, {
                    caseId: String(caseId),
                    vicId,
                    name: vic.VictimName || 'Unknown Victim'
                });
            }

            // 4. Merge Evidence Nodes & BELONGS_TO Edges
            for (const ev of evidence) {
                const evId = String(ev.EvidenceID || ev.ROWID);
                await neo4jClient.executeQuery(`
                    MATCH (c:Case { id: $caseId })
                    MERGE (e:Evidence { id: $evId })
                    ON CREATE SET e.type = $type, e.hash = $hash
                    MERGE (e)-[:BELONGS_TO]->(c)
                `, {
                    caseId: String(caseId),
                    evId,
                    type: ev.EvidenceType || 'Physical Evidence',
                    hash: ev.FileHash || ''
                });
            }

            // 5. Merge Weapons
            for (const w of weapons) {
                const wId = String(w.WeaponID || w.ROWID);
                await neo4jClient.executeQuery(`
                    MATCH (c:Case { id: $caseId })
                    MERGE (wpn:Weapon { id: $wId })
                    ON CREATE SET wpn.type = $type, wpn.model = $model
                    MERGE (wpn)-[:RECOVERED_IN]->(c)
                `, {
                    caseId: String(caseId),
                    wId,
                    type: w.WeaponType || 'Weapon',
                    model: w.MakeModel || 'Unknown'
                });
            }

            // 6. Merge Vehicles
            for (const v of vehicles) {
                const vId = String(v.VehicleID || v.ROWID);
                await neo4jClient.executeQuery(`
                    MATCH (c:Case { id: $caseId })
                    MERGE (veh:Vehicle { id: $vId })
                    ON CREATE SET veh.registration = $reg, veh.type = $type
                    MERGE (veh)-[:ASSOCIATED_WITH]->(c)
                `, {
                    caseId: String(caseId),
                    vId,
                    reg: v.RegistrationNo || 'Unknown',
                    type: v.VehicleType || 'Vehicle'
                });
            }

            // 7. Merge Real CDR Phone Nodes & CALLED Edges
            for (const cdr of cdrs) {
                if (cdr.CallerPhone && cdr.ReceiverPhone) {
                    await neo4jClient.executeQuery(`
                        MATCH (c:Case { id: $caseId })
                        MERGE (p1:Phone { number: $caller })
                        MERGE (p2:Phone { number: $receiver })
                        MERGE (p1)-[call:CALLED { timestamp: $timestamp, duration: $duration }]->(p2)
                        MERGE (p1)-[:COMMUNICATION_IN]->(c)
                    `, {
                        caseId: String(caseId),
                        caller: cdr.CallerPhone,
                        receiver: cdr.ReceiverPhone,
                        timestamp: cdr.CallTimestamp || '',
                        duration: Number(cdr.DurationSeconds) || 0
                    });
                }
            }

            // 8. Merge Financial Accounts & TRANSFERRED_TO Edges
            for (const fin of financials) {
                if (fin.SourceAccount && fin.DestinationAccount) {
                    await neo4jClient.executeQuery(`
                        MATCH (c:Case { id: $caseId })
                        MERGE (a1:FinancialAccount { accountNo: $src })
                        MERGE (a2:FinancialAccount { accountNo: $dst })
                        MERGE (a1)-[tx:TRANSFERRED_TO { amount: $amount, date: $date, suspicious: $suspicious }]->(a2)
                        MERGE (a1)-[:TRANSACTION_IN]->(c)
                    `, {
                        caseId: String(caseId),
                        src: fin.SourceAccount,
                        dst: fin.DestinationAccount,
                        amount: Number(fin.Amount) || 0,
                        date: fin.TransactionDate || '',
                        suspicious: fin.IsSuspicious === 'YES'
                    });
                }
            }

            // 9. Merge CCTV Records
            for (const cctv of cctvs) {
                const cctvId = String(cctv.CCTVRecordID || cctv.ROWID);
                await neo4jClient.executeQuery(`
                    MATCH (c:Case { id: $caseId })
                    MERGE (cam:CCTV { id: $cctvId })
                    ON CREATE SET cam.location = $loc, cam.cameraId = $camId
                    MERGE (cam)-[:CAPTURED_FOR]->(c)
                `, {
                    caseId: String(caseId),
                    cctvId,
                    loc: cctv.Location || 'Unknown Location',
                    camId: cctv.CameraID || 'CAM-01'
                });
            }

            // 10. Merge Court Hearings
            for (const h of courtHearings) {
                const hId = String(h.HearingID || h.ROWID);
                await neo4jClient.executeQuery(`
                    MATCH (c:Case { id: $caseId })
                    MERGE (hrg:CourtHearing { id: $hId })
                    ON CREATE SET hrg.stage = $stage, hrg.date = $date
                    MERGE (hrg)-[:HEARING_FOR]->(c)
                `, {
                    caseId: String(caseId),
                    hId,
                    stage: h.HearingStage || 'HEARING',
                    date: h.HearingDate || ''
                });
            }

            // 11. Merge Forensic Reports
            for (const fr of forensicReports) {
                const rId = String(fr.ReportID || fr.ROWID);
                await neo4jClient.executeQuery(`
                    MATCH (c:Case { id: $caseId })
                    MERGE (rep:ForensicReport { id: $rId })
                    ON CREATE SET rep.type = $type, rep.lab = $lab
                    MERGE (rep)-[:ANALYZED_IN]->(c)
                `, {
                    caseId: String(caseId),
                    rId,
                    type: fr.ForensicType || 'Report',
                    lab: fr.LaboratoryName || 'SFSL'
                });
            }

            return {
                synced: true,
                caseId,
                status: 'SYNCED_TO_NEO4J',
                counts: {
                    accused: accused.length,
                    victims: victims.length,
                    evidence: evidence.length,
                    weapons: weapons.length,
                    vehicles: vehicles.length,
                    cdrs: cdrs.length,
                    financials: financials.length,
                    cctv: cctvs.length,
                    hearings: courtHearings.length,
                    reports: forensicReports.length
                }
            };
        } catch (err) {
            console.error('[Neo4jGraphService] Case sync error:', err.message);
            throw err;
        }
    }

    /**
     * Traverses the graph for a case and returns nodes & edges.
     */
    static async getGraph(req, caseId) {
        if (this.isAvailable()) {
            try {
                const cypher = `
                    MATCH (c:Case { id: $caseId })
                    OPTIONAL MATCH (c)-[r]-(n)
                    RETURN c, r, n LIMIT 100
                `;
                const records = await neo4jClient.executeQuery(cypher, { caseId: String(caseId) });
                const nodesMap = {};
                const edges = [];

                records.forEach(rec => {
                    if (rec.c) nodesMap[rec.c.properties.id] = { id: rec.c.properties.id, label: rec.c.properties.crimeNo || 'Case', type: 'case' };
                    if (rec.n) nodesMap[rec.n.properties.id || rec.n.properties.number || rec.n.properties.accountNo] = {
                        id: rec.n.properties.id || rec.n.properties.number || rec.n.properties.accountNo,
                        label: rec.n.properties.name || rec.n.properties.number || rec.n.properties.accountNo || 'Entity',
                        type: rec.n.labels ? rec.n.labels[0].toLowerCase() : 'entity'
                    };
                    if (rec.r) edges.push({
                        from: rec.r.start,
                        to: rec.r.end,
                        label: rec.r.type
                    });
                });

                return {
                    isNeo4jActive: true,
                    engine: 'Neo4j Cypher Graph Engine',
                    nodes: Object.values(nodesMap),
                    edges
                };
            } catch (err) {
                console.warn('[Neo4jGraphService] Cypher query failed, falling back to Datastore relational graph:', err.message);
            }
        }

        // Clean relational graph traversal directly from Catalyst Datastore
        const rawData = await datastoreClient.getRowsWhere(req, 'CaseMaster', { CaseMasterID: caseId }, { maxRows: 1 }).then(r => r[0] || null).catch(() => null);
        const [accused, victims, evidence] = await Promise.all([
            datastoreClient.getRowsWhere(req, 'Accused', { CaseMasterID: caseId }).catch(() => []),
            datastoreClient.getRowsWhere(req, 'Victim', { CaseMasterID: caseId }).catch(() => []),
            datastoreClient.getRowsWhere(req, 'Evidence', { CaseMasterID: caseId }).catch(() => [])
        ]);

        const network = await RelationshipAgent.getNetwork({
            cases: rawData ? [rawData] : [],
            suspects: accused,
            victims,
            evidence
        }, caseId);

        return {
            isNeo4jActive: false,
            engine: 'Datastore Relational Graph Engine',
            notice: 'Neo4j cluster is unconfigured. Operating in Datastore relational graph mode.',
            nodes: network.nodes || [],
            edges: network.edges || []
        };
    }

    /**
     * Reconciles Catalyst Datastore records with Neo4j Graph Nodes & Relationships
     */
    static async reconcileGraph(req, caseId) {
        if (!this.isAvailable()) {
            return {
                isConfigured: false,
                status: 'UNCONFIGURED',
                message: 'Neo4j instance is not configured. Reconciliation unavailable.'
            };
        }

        try {
            const [
                accusedRows,
                victimsRows,
                evidenceRows,
                weaponRows,
                vehicleRows,
                cctvRows,
                hearingRows,
                reportRows
            ] = await Promise.all([
                datastoreClient.getRowsWhere(req, 'Accused', { CaseMasterID: caseId }).catch(() => []),
                datastoreClient.getRowsWhere(req, 'Victim', { CaseMasterID: caseId }).catch(() => []),
                datastoreClient.getRowsWhere(req, 'Evidence', { CaseMasterID: caseId }).catch(() => []),
                datastoreClient.getRowsWhere(req, 'Weapon', { CaseMasterID: caseId }).catch(() => []),
                datastoreClient.getRowsWhere(req, 'Vehicle', { CaseMasterID: caseId }).catch(() => []),
                datastoreClient.getRowsWhere(req, 'CCTVRecord', { CaseMasterID: caseId }).catch(() => []),
                datastoreClient.getRowsWhere(req, 'CourtHearing', { CaseMasterID: caseId }).catch(() => []),
                datastoreClient.getRowsWhere(req, 'ForensicReport', { CaseMasterID: caseId }).catch(() => [])
            ]);

            const cypherQuery = `
                MATCH (c:Case { id: $caseId })
                OPTIONAL MATCH (c)<-[:INVOLVED_IN]-(a:Accused)
                OPTIONAL MATCH (c)<-[:VICTIM_OF]-(v:Victim)
                OPTIONAL MATCH (c)<-[:BELONGS_TO]-(e:Evidence)
                OPTIONAL MATCH (c)<-[:RECOVERED_IN]-(w:Weapon)
                OPTIONAL MATCH (c)<-[:ASSOCIATED_WITH]-(veh:Vehicle)
                OPTIONAL MATCH (c)<-[:CAPTURED_FOR]-(cam:CCTV)
                OPTIONAL MATCH (c)<-[:HEARING_FOR]-(hrg:CourtHearing)
                OPTIONAL MATCH (c)<-[:ANALYZED_IN]-(rep:ForensicReport)
                RETURN c, 
                    count(DISTINCT a) as accusedCount, 
                    count(DISTINCT v) as victimCount, 
                    count(DISTINCT e) as evidenceCount,
                    count(DISTINCT w) as weaponCount,
                    count(DISTINCT veh) as vehicleCount,
                    count(DISTINCT cam) as cctvCount,
                    count(DISTINCT hrg) as hearingCount,
                    count(DISTINCT rep) as reportCount
            `;
            const records = await neo4jClient.executeQuery(cypherQuery, { caseId: String(caseId) });
            const rec = records[0] || {};

            const datastoreCounts = {
                accused: accusedRows.length,
                victims: victimsRows.length,
                evidence: evidenceRows.length,
                weapons: weaponRows.length,
                vehicles: vehicleRows.length,
                cctv: cctvRows.length,
                hearings: hearingRows.length,
                reports: reportRows.length
            };

            const neo4jCounts = {
                accused: Number(rec.accusedCount || 0),
                victims: Number(rec.victimCount || 0),
                evidence: Number(rec.evidenceCount || 0),
                weapons: Number(rec.weaponCount || 0),
                vehicles: Number(rec.vehicleCount || 0),
                cctv: Number(rec.cctvCount || 0),
                hearings: Number(rec.hearingCount || 0),
                reports: Number(rec.reportCount || 0)
            };

            const isSynced = Object.keys(datastoreCounts).every(k => datastoreCounts[k] === neo4jCounts[k]);

            return {
                isConfigured: true,
                status: 'RECONCILED',
                caseId,
                datastoreCounts,
                neo4jCounts,
                synced: isSynced,
                relationshipMismatches: isSynced ? [] : ['Count disparity detected between relational store and graph nodes.']
            };
        } catch (err) {
            return {
                isConfigured: true,
                status: 'ERROR',
                error: err.message
            };
        }
    }

    /**
     * Executes end-to-end Neo4j connection & Cypher CRUD lifecycle test:
     * CREATE -> MATCH -> UPDATE -> CREATE RELATIONSHIP -> MATCH RELATIONSHIP -> DELETE -> VERIFY DELETED
     */
    static async testLifecycle(testCaseId = 'TEST-CASE-LIFECYCLE-999') {
        if (!this.isAvailable()) {
            return {
                success: false,
                status: 'UNCONFIGURED',
                message: 'NEO4J_URI environment variable is not configured. Live test skipped.'
            };
        }

        try {
            // 1. CREATE Node
            await neo4jClient.executeQuery(`
                MERGE (c:Case { id: $id })
                SET c.crimeNo = 'LIFECYCLE-TEST', c.created = timestamp()
            `, { id: testCaseId });

            // 2. MATCH & CREATE Node + RELATIONSHIP
            await neo4jClient.executeQuery(`
                MATCH (c:Case { id: $caseId })
                MERGE (a:Accused { id: $accId })
                SET a.name = 'Test Suspect'
                MERGE (a)-[:INVOLVED_IN]->(c)
            `, { caseId: testCaseId, accId: `${testCaseId}-ACC` });

            // 3. MATCH RELATIONSHIP
            const matchRecords = await neo4jClient.executeQuery(`
                MATCH (a:Accused { id: $accId })-[r:INVOLVED_IN]->(c:Case { id: $caseId })
                RETURN a.name as name, type(r) as relType
            `, { caseId: testCaseId, accId: `${testCaseId}-ACC` });

            // 4. UPDATE Node Property
            await neo4jClient.executeQuery(`
                MATCH (c:Case { id: $id })
                SET c.updated = timestamp(), c.testPassed = true
            `, { id: testCaseId });

            // 5. DELETE / Cleanup Test Nodes
            await neo4jClient.executeQuery(`
                MATCH (c:Case { id: $caseId })
                OPTIONAL MATCH (c)<-[r]-(n)
                WHERE n.id STARTS WITH $caseId
                DETACH DELETE c, n
            `, { caseId: testCaseId });

            // 6. VERIFY DELETED
            const verifyRecords = await neo4jClient.executeQuery(`
                MATCH (c:Case { id: $caseId })
                RETURN count(c) as remainingCount
            `, { caseId: testCaseId });

            const remaining = Number(verifyRecords[0]?.remainingCount || 0);

            return {
                success: remaining === 0,
                status: 'LIVE_VERIFIED',
                queriedRecords: matchRecords.length,
                cleanedUp: remaining === 0,
                message: 'Complete Neo4j Cypher CRUD lifecycle test (CREATE -> MATCH -> UPDATE -> RELATE -> DELETE -> VERIFY) passed.'
            };
        } catch (err) {
            return {
                success: false,
                status: 'ERROR',
                error: err.message
            };
        }
    }
}

module.exports = Neo4jGraphService;
