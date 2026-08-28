/**
 * live_production_verification.js
 * Comprehensive live production verification test suite for VIKSHANA.
 * Tests HTTP APIs, RBAC matrices, 10 Forensic Domains, Neo4j, Python ML, Vector RAG, and Injection Attacks.
 */

const assert = require('assert');
const crypto = require('crypto');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'vikshana-live-verification-jwt-secret-2026';
process.env.NODE_ENV = 'test';

const { verifyToken, authenticateToken, authorizeRole } = require('../middleware/authorize.middleware');
const { sanitizeData } = require('../middleware/fieldFilter.middleware');
const AuthController = require('../controllers/AuthController');
const HealthService = require('../services/HealthService');
const ForensicService = require('../services/ForensicService');
const VectorRAGService = require('../services/VectorRAGService');
const PythonMLBridge = require('../services/PythonMLBridge');
const Neo4jGraphService = require('../services/Neo4jGraphService');
const TextToSQLService = require('../services/TextToSQLService');
const digestUtil = require('../utils/digestUtil');

let passedCount = 0;
let failedCount = 0;

function logPass(name) {
    console.log(`  [PASS] ${name}`);
    passedCount++;
}

function logFail(name, err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message || err}`);
    failedCount++;
}

function test(name, fn) {
    try {
        fn();
        logPass(name);
    } catch (e) {
        logFail(name, e);
    }
}

async function asyncTest(name, fn) {
    try {
        await fn();
        logPass(name);
    } catch (e) {
        logFail(name, e);
    }
}

function createJWT(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
    const sig = crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${sig}`;
}

async function runAll() {
    console.log('===============================================================');
    console.log('VIKSHANA LIVE PRODUCTION COMPREHENSIVE VERIFICATION SUITE');
    console.log('===============================================================\n');

    // -----------------------------------------------------------------
    // SECTION 1: OBSERVABILITY & HEALTH MONITORING
    // -----------------------------------------------------------------
    console.log('--- 1. Observability & Subsystem Health (/health) ---');

    await asyncTest('HealthService returns UP or DEGRADED status with full subsystem telemetry', async () => {
        const req = {};
        const health = await HealthService.getSystemHealth(req);
        assert(health.status === 'UP' || health.status === 'DEGRADED');
        assert(health.version.includes('2.4.0'));
        assert(health.services.pythonML, 'Python ML telemetry must be present');
        assert(health.services.neo4j, 'Neo4j telemetry must be present');
        assert(typeof health.uptimeSeconds === 'number', 'Uptime must be reported');
    });

    // -----------------------------------------------------------------
    // SECTION 2: AUTHENTICATION & USER PERSISTENCE
    // -----------------------------------------------------------------
    console.log('\n--- 2. Authentication & User Persistence ---');

    await asyncTest('AuthController authenticates valid officer credentials', async () => {
        const req = { body: { email: 'officer', password: 'password123' } };
        let statusCode = null, resData = null;
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (data) => { resData = data; return res; }
        };
        await AuthController.login(req, res);
        assert.strictEqual(statusCode, 200);
        assert.strictEqual(resData.success, true);
        assert(resData.token, 'Token must be issued');
        assert.strictEqual(resData.user.role, 'Officer');
    });

    await asyncTest('AuthController strictly rejects wrong passwords with 401', async () => {
        const req = { body: { email: 'officer', password: 'badpassword' } };
        let statusCode = null;
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: () => res
        };
        await AuthController.login(req, res);
        assert.strictEqual(statusCode, 401);
    });

    await asyncTest('AuthController.createUser provisions user with PBKDF2 salt and metadata', async () => {
        const req = {
            user: { role: 'Administrator', name: 'Admin' },
            body: {
                username: 'subinspector_patil',
                password: 'SecurePassword2026!',
                role: 'Investigator',
                name: 'S. I. Patil',
                department: 'Ballari Circle'
            }
        };
        let statusCode = null, resData = null;
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (data) => { resData = data; return res; }
        };
        await AuthController.createUser(req, res);
        assert.strictEqual(statusCode, 201);
        assert.strictEqual(resData.success, true);
        assert.strictEqual(resData.data.username, 'subinspector_patil');
        assert.strictEqual(resData.data.role, 'Investigator');
    });

    // -----------------------------------------------------------------
    // SECTION 3: ROLE-BY-ROLE RBAC MATRICES & PRIVILEGE ESCALATION
    // -----------------------------------------------------------------
    console.log('\n--- 3. Role-by-Role RBAC & Privilege Escalation ---');

    test('Officer is allowed for investigator routes', () => {
        const middleware = authorizeRole('Administrator', 'Investigator', 'Officer');
        const req = { user: { role: 'Officer' } };
        let nextCalled = false;
        middleware(req, {}, () => { nextCalled = true; });
        assert.strictEqual(nextCalled, true);
    });

    test('Officer is strictly rejected from Administrator-only audit logs with 403', () => {
        const middleware = authorizeRole('Administrator');
        const req = { user: { role: 'Officer' }, originalUrl: '/audit/logs' };
        let statusCode = null;
        const res = {
            status: (c) => { statusCode = c; return res; },
            json: () => res
        };
        let nextCalled = false;
        middleware(req, res, () => { nextCalled = true; });
        assert.strictEqual(nextCalled, false);
        assert.strictEqual(statusCode, 403);
    });

    test('Analyst role accesses data with sensitive PII masked', () => {
        const sensitive = {
            name: 'Vijay Kumar',
            phone: '9988776655',
            bank_account: 'SB-98765432',
            crime: 'Burglary'
        };
        const sanitized = sanitizeData(sensitive, 'Analyst');
        assert.strictEqual(sanitized.phone, '***-***-6655');
        assert.strictEqual(sanitized.bank_account, '***-HIDDEN-***');
        assert.strictEqual(sanitized.crime, 'Burglary');
    });

    test('Policymaker role personal identifiers are completely redacted', () => {
        const sensitive = {
            name: 'Vijay Kumar',
            phone: '9988776655',
            category: 'Robbery'
        };
        const sanitized = sanitizeData(sensitive, 'Policymaker');
        assert.strictEqual(sanitized.name, undefined);
        assert.strictEqual(sanitized.phone, undefined);
        assert.strictEqual(sanitized.category, 'Robbery');
    });

    // -----------------------------------------------------------------
    // SECTION 4: 10 FORENSIC DATA DOMAINS (CRUD & AUDIT LOGGING)
    // -----------------------------------------------------------------
    console.log('\n--- 4. Multi-Modal Forensic Data Layer (10 Domains) ---');

    await asyncTest('Domain 1: Evidence & Cryptographic Integrity Digest', async () => {
        const req = { user: { name: 'Insp. R. Singh' } };
        const ev = await ForensicService.createEvidence(req, {
            caseMasterId: '101',
            evidenceType: 'Digital Media',
            description: 'Recovered USB drive with encrypted logs',
            storageLocation: 'HQ Safe Vault 3'
        });
        assert(ev.EvidenceID);
        assert.strictEqual(ev.FileHash.length, 64, 'SHA-256 digest must be 64 hex characters');
        assert.strictEqual(ev.ChainOfCustodyStatus, 'SECURED_IN_VAULT');
    });

    await asyncTest('Domain 2: CCTV Record & Metadata Management', async () => {
        const req = { user: { name: 'Officer' } };
        const cctv = await ForensicService.createCCTV(req, {
            caseMasterId: '101',
            cameraId: 'CAM-MG-ROAD-04',
            location: 'MG Road Junction',
            description: 'Suspect vehicle movement at 22:45'
        });
        assert(cctv.CCTVRecordID);
        assert.strictEqual(cctv.CameraID, 'CAM-MG-ROAD-04');
    });

    await asyncTest('Domain 3: CDR Phone Network Frequency Analysis', async () => {
        const req = {};
        const cdr = await ForensicService.createCDR(req, {
            caseMasterId: '101',
            callerPhone: '+919988001122',
            receiverPhone: '+919944332211',
            durationSeconds: 240,
            cellTowerLocation: 'Indiranagar Tower 2'
        });
        assert(cdr.CDRID);
        assert.strictEqual(cdr.DurationSeconds, 240);
    });

    await asyncTest('Domain 4: Financial Transactions & Structuring Detection', async () => {
        const req = {};
        const txn = await ForensicService.createTransaction(req, {
            caseMasterId: '101',
            sourceAccount: 'AC-10029384',
            destinationAccount: 'AC-99482711',
            amount: 750000,
            bankName: 'HDFC Bank'
        });
        assert.strictEqual(txn.IsSuspicious, 'YES');
        assert(txn.SuspiciousReason.includes('High-value threshold exceeded'));
    });

    await asyncTest('Domain 5: State Forensic Science Laboratory (SFSL) Reports', async () => {
        const req = {};
        const rep = await ForensicService.createReport(req, {
            caseMasterId: '101',
            forensicType: 'Ballistics',
            laboratoryName: 'SFSL Bengaluru',
            expertName: 'Dr. K. Sharma',
            findingsSummary: 'Fired cartridge matches test firing markings with 99.4% confidence.'
        });
        assert(rep.ReportID);
        assert.strictEqual(rep.ForensicType, 'Ballistics');
    });

    await asyncTest('Domain 6: Weapons & Ballistics Seizures', async () => {
        const req = {};
        const wpn = await ForensicService.createWeapon(req, {
            caseMasterId: '101',
            weaponType: 'Firearm',
            makeModel: 'Country Pistol .32',
            caliberSerialNo: 'CP-32-9912',
            recoveryLocation: 'Under culvert near railway line'
        });
        assert(wpn.WeaponID);
        assert.strictEqual(wpn.CaliberSerialNo, 'CP-32-9912');
    });

    await asyncTest('Domain 7: Vehicle Seizures & Impound Registry', async () => {
        const req = {};
        const veh = await ForensicService.createVehicle(req, {
            caseMasterId: '101',
            registrationNo: 'KA-04-MB-1234',
            vehicleType: 'Four Wheeler (SUV)',
            make: 'Mahindra',
            model: 'Scorpio',
            color: 'Black'
        });
        assert(veh.VehicleID);
        assert.strictEqual(veh.RegistrationNo, 'KA-04-MB-1234');
    });

    await asyncTest('Domain 8: Biometric Reference Registry (AFIS / DNA profile IDs)', async () => {
        const req = {};
        const bio = await ForensicService.createBiometric(req, {
            caseMasterId: '101',
            biometricType: 'DNA_PROFILE_REF',
            referenceId: 'DNA-REF-2026-0812-KA',
            matchSource: 'State DNA Database',
            matchConfidence: 99.8
        });
        assert(bio.BiometricID);
        assert.strictEqual(bio.BiometricType, 'DNA_PROFILE_REF');
    });

    await asyncTest('Domain 9: Judicial Court Hearings & Orders', async () => {
        const req = {};
        const court = await ForensicService.createCourtHearing(req, {
            caseMasterId: '101',
            courtId: 'C-BALLARI-01',
            judgeName: 'Hon. Magistrate S. Roy',
            hearingStage: 'Judicial Remand Hearing',
            courtOrder: 'Remand extended by 14 days'
        });
        assert(court.HearingID);
        assert.strictEqual(court.CourtOrder, 'Remand extended by 14 days');
    });

    await asyncTest('Domain 10: Interrogations & Admissions Repository', async () => {
        const req = {};
        const intg = await ForensicService.createInterrogation(req, {
            caseMasterId: '101',
            accusedMasterId: '201',
            interrogatingOfficerId: 'IO-99',
            summary: 'Subject admitted to meeting co-accused on the night of incident.',
            keyAdmissions: 'Provided location of concealed vehicle keys.'
        });
        assert(intg.InterrogationID);
        assert(intg.KeyAdmissions.includes('concealed vehicle keys'));
    });

    // -----------------------------------------------------------------
    // SECTION 5: VECTOR RAG LOCAL DETERMINISTIC RETRIEVAL
    // -----------------------------------------------------------------
    console.log('\n--- 5. Vector RAG Local Deterministic Retrieval ---');

    test('128-dim embedding produces exact L2 unit normalization', () => {
        const vec = VectorRAGService.generateEmbedding('Stolen gold necklace from jewelry store');
        assert.strictEqual(vec.length, 128);
        let sumSq = 0;
        vec.forEach(v => { sumSq += v * v; });
        assert(Math.abs(Math.sqrt(sumSq) - 1.0) < 0.001);
    });

    test('Cosine similarity ranks semantically related crime queries higher', () => {
        const qVec = VectorRAGService.generateEmbedding('armed robbery bank cash');
        const docMatch = VectorRAGService.generateEmbedding('gunpoint robbery at bank cash counter');
        const docUnrelated = VectorRAGService.generateEmbedding('traffic speeding violation highway');
        const simMatch = VectorRAGService.cosineSimilarity(qVec, docMatch);
        const simUnrelated = VectorRAGService.cosineSimilarity(qVec, docUnrelated);
        assert(simMatch > simUnrelated);
    });

    await asyncTest('Grounded retrieval honestly rejects non-existent fictitious entities', async () => {
        const req = {};
        const res = await VectorRAGService.answerGroundedQuery(req, {
            query: 'Did the suspect use an interstellar laser weapon from Mars?'
        });
        assert(res.answer.includes('No relevant') || res.answer.includes('Data not available'));
    });

    // -----------------------------------------------------------------
    // SECTION 6: PYTHON SCIKIT-LEARN ML PIPELINE
    // -----------------------------------------------------------------
    console.log('\n--- 6. Python Scikit-Learn ML Pipeline ---');

    await asyncTest('Python ML Bridge checks microservice health', async () => {
        const health = await PythonMLBridge.getHealth();
        assert.strictEqual(health.status, 'ONLINE');
    });

    await asyncTest('DBSCAN spatial clustering groups nearby GPS coordinates', async () => {
        const coords = [
            { lat: 12.9716, lng: 77.5946 },
            { lat: 12.9717, lng: 77.5947 },
            { lat: 12.9719, lng: 77.5949 },
            { lat: 15.3173, lng: 75.7139 } // Outlier point
        ];
        const res = await PythonMLBridge.clusterHotspots(coords, 2.0, 2);
        assert.strictEqual(res.status, 'SUCCESS');
        assert(res.clusterCount >= 1);
    });

    await asyncTest('Ridge regression time-series projects trends with 95% confidence intervals', async () => {
        const history = [
            { period: '2026-01', count: 10 },
            { period: '2026-02', count: 14 },
            { period: '2026-03', count: 18 },
            { period: '2026-04', count: 21 },
            { period: '2026-05', count: 26 }
        ];
        const res = await PythonMLBridge.forecastCrimeTrends(history, 3);
        assert.strictEqual(res.status, 'SUCCESS');
        assert.strictEqual(res.forecast.length, 3);
        assert(res.forecast[0].confidenceInterval95.lower !== undefined);
        assert(res.forecast[0].confidenceInterval95.upper !== undefined);
    });

    await asyncTest('Sparse time-series (< 4 intervals) returns INSUFFICIENT_DATA_FOR_FORECAST', async () => {
        const sparseHistory = [
            { period: '2026-01', count: 5 },
            { period: '2026-02', count: 7 }
        ];
        const res = await PythonMLBridge.forecastCrimeTrends(sparseHistory, 3);
        assert.strictEqual(res.status, 'INSUFFICIENT_DATA_FOR_FORECAST');
    });

    // -----------------------------------------------------------------
    // SECTION 7: NEO4J GRAPH ENGINE & RECONCILIATION
    // -----------------------------------------------------------------
    console.log('\n--- 7. Neo4j Graph Engine & Reconciliation ---');

    test('Neo4jGraphService.isAvailable reports configuration state honestly', () => {
        const avail = Neo4jGraphService.isAvailable();
        assert(typeof avail === 'boolean');
    });

    await asyncTest('Neo4j reconciliation returns structured datastore comparison', async () => {
        const req = {};
        const recon = await Neo4jGraphService.reconcileGraph(req, '101');
        assert(recon.status === 'UNCONFIGURED' || recon.status === 'RECONCILED');
    });

    // -----------------------------------------------------------------
    // SECTION 8: SQL INJECTION & PROMPT ATTACK DEFENSE
    // -----------------------------------------------------------------
    console.log('\n--- 8. Text-to-SQL & Prompt Injection Defense ---');

    const textToSql = TextToSQLService;

    test('validateSQL allows valid read-only SELECT queries', () => {
        const validQuery = 'SELECT CaseMasterID, CrimeNo, BriefFacts FROM CaseMaster WHERE BriefFacts LIKE \'%Theft%\'';
        assert.strictEqual(textToSql.validateSQL(validQuery), true);
    });

    test('validateSQL strictly blocks DROP statements', () => {
        assert.throws(() => {
            textToSql.validateSQL('DROP TABLE CaseMaster');
        }, /(Only SELECT queries are allowed|Unsafe keyword detected: DROP)/);
    });

    test('validateSQL strictly blocks DELETE statements', () => {
        assert.throws(() => {
            textToSql.validateSQL('DELETE FROM Accused WHERE CaseMasterID = 101');
        }, /(Only SELECT queries are allowed|Unsafe keyword detected: DELETE)/);
    });

    test('validateSQL strictly blocks UPDATE statements', () => {
        assert.throws(() => {
            textToSql.validateSQL('UPDATE CaseMaster SET CaseStatusID = 5');
        }, /(Only SELECT queries are allowed|Unsafe keyword detected: UPDATE)/);
    });

    test('validateSQL strictly blocks embedded destructive injection in SELECT', () => {
        assert.throws(() => {
            textToSql.validateSQL('SELECT * FROM CaseMaster; DROP TABLE CaseMaster');
        }, /Unsafe keyword detected: DROP/);
    });

    // -----------------------------------------------------------------
    // SECTION 9: CRYPTOGRAPHIC DOCUMENT INTEGRITY DIGEST (SHA-256)
    // -----------------------------------------------------------------
    console.log('\n--- 9. Cryptographic Document Integrity Digest ---');

    test('digestUtil produces a 64-char uppercase hex digest', () => {
        const digest = digestUtil.calculateSHA256Digest('VIKSHANA-CASE-101-FINAL-REPORT');
        assert.strictEqual(digest.length, 64);
        assert(/^[0-9A-F]{64}$/.test(digest));
    });

    test('digestUtil is deterministic across runs', () => {
        const d1 = digestUtil.calculateSHA256Digest('VIKSHANA-VERIFICATION');
        const d2 = digestUtil.calculateSHA256Digest('VIKSHANA-VERIFICATION');
        assert.strictEqual(d1, d2);
    });

    // -----------------------------------------------------------------
    // SUMMARY
    // -----------------------------------------------------------------
    console.log('\n===============================================================');
    console.log(`LIVE PRODUCTION VERIFICATION COMPLETE`);
    console.log(`TOTAL SUITE CHECKS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
    console.log('===============================================================');

    process.exit(failedCount > 0 ? 1 : 0);
}

runAll().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
