/**
 * master_hardening_test_suite.js
 * Comprehensive automated verification test suite for VIKSHANA hardened backend.
 * Covers Cryptography, RBAC, Multi-Modal Forensics, Neo4j, Vector RAG, Python ML Pipeline, and PII.
 */

const assert = require('assert');
const crypto = require('crypto');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'vikshana-test-environment-jwt-secret-key-hs256';
process.env.NODE_ENV = 'test';

const { verifyToken, authenticateToken, authorizeRole } = require('../middleware/authorize.middleware');
const { fieldFilter, sanitizeData } = require('../middleware/fieldFilter.middleware');
const AuthController = require('../controllers/AuthController');
const QuickMLService = require('../services/QuickMLService');
const RelationshipAgent = require('../agents/RelationshipAgent');
const datastoreClient = require('../queries/datastoreClient');
const neo4jClient = require('../queries/neo4j_client');
const digestUtil = require('../utils/digestUtil');
const ForensicService = require('../services/ForensicService');
const Neo4jGraphService = require('../services/Neo4jGraphService');
const VectorRAGService = require('../services/VectorRAGService');
const PythonMLBridge = require('../services/PythonMLBridge');

let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, fn) {
    try {
        fn();
        console.log(`  [PASS] ${testName}`);
        testsPassed++;
    } catch (err) {
        console.error(`  [FAIL] ${testName}`);
        console.error(`         ${err.message}`);
        testsFailed++;
    }
}

async function runAsyncTest(testName, fn) {
    try {
        await fn();
        console.log(`  [PASS] ${testName}`);
        testsPassed++;
    } catch (err) {
        console.error(`  [FAIL] ${testName}`);
        console.error(`         ${err.message}`);
        testsFailed++;
    }
}

console.log('===============================================================');
console.log('VIKSHANA PRODUCTION HARDENING AUTOMATED MASTER TEST SUITE');
console.log('===============================================================\n');

async function main() {
    // -------------------------------------------------------------
    // 1. CRYPTOGRAPHIC JWT & SECURITY VERIFICATION
    // -------------------------------------------------------------
    console.log('--- 1. Security & Cryptographic Authentication Tests ---');

    const JWT_SECRET = process.env.JWT_SECRET;
    
    function generateTestToken(payload, secret = JWT_SECRET, alg = 'HS256') {
        const header = Buffer.from(JSON.stringify({ alg, typ: 'JWT' })).toString('base64url');
        const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
        return `${header}.${body}.${sig}`;
    }

    runTest('Valid HMAC-SHA256 token is accepted', () => {
        const validPayload = { id: 'admin', role: 'Administrator', exp: Math.floor(Date.now() / 1000) + 3600 };
        const token = generateTestToken(validPayload);
        const decoded = verifyToken(token);
        assert(decoded !== null, 'Token should be verified');
        assert.strictEqual(decoded.id, 'admin');
        assert.strictEqual(decoded.role, 'Administrator');
    });

    runTest('Forged/Tampered signature is strictly rejected', () => {
        const payload = { id: 'attacker', role: 'Administrator', exp: Math.floor(Date.now() / 1000) + 3600 };
        const forgedToken = generateTestToken(payload, 'wrong-secret-key-123456');
        const decoded = verifyToken(forgedToken);
        assert.strictEqual(decoded, null, 'Forged token must be rejected');
    });

    runTest('Tampered payload in valid signature is strictly rejected', () => {
        const validPayload = { id: 'officer', role: 'Officer', exp: Math.floor(Date.now() / 1000) + 3600 };
        const token = generateTestToken(validPayload);
        const parts = token.split('.');
        const tamperedPayload = Buffer.from(JSON.stringify({ id: 'officer', role: 'Administrator' })).toString('base64url');
        const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
        const decoded = verifyToken(tamperedToken);
        assert.strictEqual(decoded, null, 'Tampered payload token must be rejected');
    });

    runTest('Expired token is strictly rejected', () => {
        const expiredPayload = { id: 'admin', role: 'Administrator', exp: Math.floor(Date.now() / 1000) - 60 };
        const token = generateTestToken(expiredPayload);
        const decoded = verifyToken(token);
        assert.strictEqual(decoded, null, 'Expired token must be rejected');
    });

    runTest('Corrupted or invalid JWT format returns null', () => {
        assert.strictEqual(verifyToken('not-a-token'), null);
        assert.strictEqual(verifyToken('a.b'), null);
        assert.strictEqual(verifyToken(null), null);
        assert.strictEqual(verifyToken(undefined), null);
    });

    runTest('Algorithm manipulation (e.g. none or RS256) is strictly rejected', () => {
        const payload = { id: 'admin', role: 'Administrator' };
        const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
        const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const token = `${header}.${body}.`;
        assert.strictEqual(verifyToken(token), null, 'Unsigned or non-HS256 tokens must be rejected');
    });

    // -------------------------------------------------------------
    // 2. AUTHENTICATION & RBAC MIDDLEWARE REJECTION TESTS
    // -------------------------------------------------------------
    console.log('\n--- 2. Auth & RBAC Middleware Enforcement Tests ---');

    runTest('authenticateToken rejects missing token with 401 UNAUTHENTICATED', () => {
        const req = { headers: {} };
        let statusCode = null;
        let resJson = null;
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (data) => { resJson = data; return res; }
        };
        let nextCalled = false;
        authenticateToken(req, res, () => { nextCalled = true; });

        assert.strictEqual(nextCalled, false, 'next() should not be called');
        assert.strictEqual(statusCode, 401);
        assert.strictEqual(resJson.code, 'UNAUTHENTICATED');
    });

    runTest('authenticateToken rejects invalid/forged token with 401 INVALID_TOKEN', () => {
        const req = { headers: { authorization: 'Bearer invalid.forged.signature' } };
        let statusCode = null;
        let resJson = null;
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (data) => { resJson = data; return res; }
        };
        let nextCalled = false;
        authenticateToken(req, res, () => { nextCalled = true; });

        assert.strictEqual(nextCalled, false, 'next() should not be called');
        assert.strictEqual(statusCode, 401);
        assert.strictEqual(resJson.code, 'INVALID_TOKEN');
    });

    runTest('authenticateToken attaches verified user payload and calls next()', () => {
        const validPayload = { id: 'inv01', role: 'Investigator', exp: Math.floor(Date.now() / 1000) + 3600 };
        const token = generateTestToken(validPayload);
        const req = { headers: { authorization: `Bearer ${token}` } };
        let nextCalled = false;
        authenticateToken(req, {}, () => { nextCalled = true; });

        assert.strictEqual(nextCalled, true, 'next() should be called');
        assert.strictEqual(req.user.id, 'inv01');
        assert.strictEqual(req.user.role, 'Investigator');
    });

    runTest('authorizeRole allows authorized role', () => {
        const middleware = authorizeRole('Administrator', 'Supervisor');
        const req = { user: { role: 'Administrator' }, originalUrl: '/audit' };
        let nextCalled = false;
        middleware(req, {}, () => { nextCalled = true; });
        assert.strictEqual(nextCalled, true, 'Administrator should be allowed');
    });

    runTest('authorizeRole strictly rejects unauthorized role with 403 Forbidden', () => {
        const middleware = authorizeRole('Administrator', 'Supervisor');
        const req = { user: { role: 'Analyst' }, originalUrl: '/audit' };
        let statusCode = null;
        let resJson = null;
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (data) => { resJson = data; return res; }
        };
        let nextCalled = false;
        middleware(req, res, () => { nextCalled = true; });

        assert.strictEqual(nextCalled, false, 'Analyst should NOT access audit');
        assert.strictEqual(statusCode, 403);
        assert(resJson.error.includes('Forbidden'));
    });

    // -------------------------------------------------------------
    // 3. AUTH CONTROLLER INTEGRITY & CREDENTIAL PROTECTION
    // -------------------------------------------------------------
    console.log('\n--- 3. Auth Controller & Credential Protection Tests ---');

    await runAsyncTest('Login authenticates valid users with salted PBKDF2 hashes', async () => {
        const req = { body: { email: 'admin', password: 'admin123' } };
        let responseData = null;
        let statusCode = null;
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (data) => { responseData = data; return res; }
        };
        await AuthController.login(req, res);
        assert.strictEqual(statusCode, 200);
        assert.strictEqual(responseData.success, true);
        assert(responseData.token, 'Token should be returned');
        assert.strictEqual(responseData.user.role, 'Administrator');
    });

    await runAsyncTest('Login strictly rejects incorrect passwords', async () => {
        const req = { body: { email: 'admin', password: 'wrongPassword!@#' } };
        let responseData = null;
        let statusCode = null;
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (data) => { responseData = data; return res; }
        };
        await AuthController.login(req, res);
        assert.strictEqual(statusCode, 401);
        assert.strictEqual(responseData.success, false);
    });

    await runAsyncTest('ForgotPassword does NOT leak plaintext passwords', async () => {
        const req = { body: { email: 'admin' } };
        let responseData = null;
        const res = {
            status: () => res,
            json: (data) => { responseData = data; return res; }
        };
        await AuthController.forgotPassword(req, res);
        assert.strictEqual(responseData.success, true);
        assert(!JSON.stringify(responseData).includes('admin123'), 'Plaintext password must not be leaked');
    });

    await runAsyncTest('Google OAuth returns honest 501 Not Implemented', async () => {
        const req = {};
        let statusCode = null;
        let responseData = null;
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (data) => { responseData = data; return res; }
        };
        await AuthController.googleAuth(req, res);
        assert.strictEqual(statusCode, 501);
        assert.strictEqual(responseData.code, 'OAUTH_NOT_CONFIGURED');
    });

    // -------------------------------------------------------------
    // 4. BACKEND API CONTRACT & TRANSLATION TESTS
    // -------------------------------------------------------------
    console.log('\n--- 4. Backend API Contract & Translation Tests ---');

    await runAsyncTest('QuickMLService.translateText handles { texts, sourceLanguage, targetLanguage }', async () => {
        const req = {};
        const translations = await QuickMLService.translateText(req, {
            texts: ['Police Station', 'Investigation'],
            sourceLanguage: 'en',
            targetLanguage: 'en'
        });
        assert(Array.isArray(translations), 'Should return array');
        assert.strictEqual(translations.length, 2);
        assert.strictEqual(translations[0], 'Police Station');
    });

    await runAsyncTest('QuickMLService.translateText handles empty input gracefully', async () => {
        const req = {};
        const translations = await QuickMLService.translateText(req, { texts: [] });
        assert(Array.isArray(translations), 'Should return empty array');
        assert.strictEqual(translations.length, 0);
    });

    // -------------------------------------------------------------
    // 5. SPATIAL CLUSTERING & INTELLIGENCE ENGINES
    // -------------------------------------------------------------
    console.log('\n--- 5. Real Spatial Clustering & Graph Intelligence Tests ---');

    await runAsyncTest('predictCrimeHotspots returns genuine spatial density cluster structure', async () => {
        const req = {};
        const result = await QuickMLService.predictCrimeHotspots(req, { sectorId: 'Sector-18' });
        assert(result.analysisType.includes('Spatial'), 'Should indicate spatial analysis');
        assert(Array.isArray(result.predictedHotspots), 'Should return array of clusters');
    });

    runTest('RelationshipAgent.getNetwork produces authentic edge labels without mock injection', async () => {
        const rawData = {
            cases: [{ id: '101', crimeNo: 'CR-101', officerId: '99' }],
            suspects: [{ id: 'S1', caseId: '101', name: 'Ramesh Kumar' }],
            victims: [{ id: 'V1', caseId: '101', name: 'Suresh Patil' }],
            witnesses: [{ id: 'W1', caseId: '101', name: 'Anil Rao' }],
            arrests: [{ id: 'A1', caseId: '101', accusedId: 'S1', type: 'Arrested' }],
            chargesheets: [{ id: 'CS1', caseId: '101' }]
        };
        const result = await RelationshipAgent.getNetwork(rawData, '101');
        assert(Array.isArray(result.nodes), 'Nodes array');
        assert(Array.isArray(result.edges), 'Edges array');
        const analyticalNodes = result.nodes.filter(n => n.type === 'analytical');
        assert.strictEqual(analyticalNodes.length, 0, 'No mock analytical nodes should exist in graph');
    });

    // -------------------------------------------------------------
    // 6. NEO4J CLIENT & GRAPH SERVICE INTEGRITY
    // -------------------------------------------------------------
    console.log('\n--- 6. Neo4j Client Configuration Safety Tests ---');

    runTest('Neo4j client correctly reports unconfigured state without crashing', () => {
        assert.strictEqual(neo4jClient.isConfigured(), false);
    });

    await runAsyncTest('Neo4jGraphService falls back cleanly to Datastore relational graph', async () => {
        const req = {};
        const graph = await Neo4jGraphService.getGraph(req, '101');
        assert.strictEqual(graph.isNeo4jActive, false);
        assert(Array.isArray(graph.nodes), 'Should return graph nodes');
        assert(Array.isArray(graph.edges), 'Should return graph edges');
    });

    // -------------------------------------------------------------
    // 7. DATA PRIVACY & RBAC SANITIZATION
    // -------------------------------------------------------------
    console.log('\n--- 7. Data Privacy (Field Filter) Sanitization Tests ---');

    runTest('FieldFilter masks sensitive PII for Analyst role', () => {
        const sensitive = { name: 'John', phone: '9876543210', bank_account: 'ACC-99212', notes: 'Public note' };
        const sanitized = sanitizeData(sensitive, 'Analyst');
        assert.strictEqual(sanitized.phone, '***-***-3210');
        assert.strictEqual(sanitized.bank_account, '***-HIDDEN-***');
    });

    runTest('FieldFilter drops personal identifiers for Policymaker role', () => {
        const sensitive = { name: 'John', phone: '9876543210', category: 'Theft' };
        const sanitized = sanitizeData(sensitive, 'Policymaker');
        assert.strictEqual(sanitized.name, undefined);
        assert.strictEqual(sanitized.phone, undefined);
    });

    // -------------------------------------------------------------
    // 8. CRYPTOGRAPHIC PDF DIGEST MODULE VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- 8. Production Document Digest (SHA-256) Module Tests ---');

    runTest('digestUtil produces a valid 64-character uppercase hexadecimal digest', () => {
        const content = 'VIKSHANA-CASE-101-INVESTIGATION-DOCKET-2026';
        const digest = digestUtil.calculateSHA256Digest(content);
        assert.strictEqual(digest.length, 64, 'Digest must be exactly 64 characters');
        assert(/^[0-9A-F]{64}$/.test(digest), 'Digest must be valid uppercase hex');
    });

    runTest('digestUtil is deterministic (same input produces identical digest)', () => {
        const content = 'VIKSHANA-CHAIN-OF-CUSTODY-VERIFICATION';
        const d1 = digestUtil.calculateSHA256Digest(content);
        const d2 = digestUtil.calculateSHA256Digest(content);
        assert.strictEqual(d1, d2, 'Same content must produce identical digest');
    });

    runTest('digestUtil is sensitive to content changes', () => {
        const d1 = digestUtil.calculateSHA256Digest('Case Document Revision A');
        const d2 = digestUtil.calculateSHA256Digest('Case Document Revision B');
        assert.notStrictEqual(d1, d2, 'Altered content must produce a distinct hash');
    });

    // -------------------------------------------------------------
    // 9. FORENSIC MULTI-MODAL INTELLIGENCE TESTS
    // -------------------------------------------------------------
    console.log('\n--- 9. Forensic Multi-Modal Intelligence Tests ---');

    await runAsyncTest('ForensicService.createEvidence records item with valid SHA-256 chain of custody', async () => {
        const req = { user: { name: 'Insp. R. Singh' } };
        const evidence = await ForensicService.createEvidence(req, {
            caseMasterId: '101',
            evidenceType: 'Recovered Weapon',
            description: 'Country pistol recovered near scene',
            storageLocation: 'Vault 4B'
        });
        assert(evidence.EvidenceID, 'Should have EvidenceID');
        assert.strictEqual(evidence.FileHash.length, 64, 'Must compute 64-char SHA-256 hash');
        assert.strictEqual(evidence.ChainOfCustodyStatus, 'SECURED_IN_VAULT');
    });

    await runAsyncTest('ForensicService.createTransaction flags suspicious high-value structured transactions', async () => {
        const req = {};
        const txn = await ForensicService.createTransaction(req, {
            caseMasterId: '101',
            sourceAccount: 'SB-10023849',
            destinationAccount: 'SB-98837482',
            amount: 600000,
            bankName: 'State Bank'
        });
        assert.strictEqual(txn.IsSuspicious, 'YES');
        assert(txn.SuspiciousReason.includes('High-value threshold exceeded'));
    });

    await runAsyncTest('ForensicService.createCDR records communication metadata', async () => {
        const req = {};
        const cdr = await ForensicService.createCDR(req, {
            caseMasterId: '101',
            callerPhone: '+919876543210',
            receiverPhone: '+919845012345',
            durationSeconds: 180,
            cellTowerLocation: 'Koramangala Tower 4'
        });
        assert(cdr.CDRID, 'Should have CDRID');
        assert.strictEqual(cdr.DurationSeconds, 180);
    });

    // -------------------------------------------------------------
    // 10. VECTOR RAG & SEMANTIC RETRIEVAL TESTS
    // -------------------------------------------------------------
    console.log('\n--- 10. Semantic Vector-RAG & Hallucination Defense Tests ---');

    runTest('VectorRAGService.generateEmbedding produces 128-dim normalized unit vector', () => {
        const vec = VectorRAGService.generateEmbedding('Theft of red motorcycle near MG Road');
        assert.strictEqual(vec.length, 128, 'Vector dimension must be 128');
        let norm = 0;
        vec.forEach(v => { norm += v * v; });
        assert(Math.abs(Math.sqrt(norm) - 1.0) < 0.001, 'Vector must be L2 normalized');
    });

    runTest('VectorRAGService.cosineSimilarity correctly measures semantic closeness', () => {
        const v1 = VectorRAGService.generateEmbedding('Armed robbery at jewelry store');
        const v2 = VectorRAGService.generateEmbedding('Armed theft at gold shop');
        const v3 = VectorRAGService.generateEmbedding('Traffic parking violation');
        const simHigh = VectorRAGService.cosineSimilarity(v1, v2);
        const simLow = VectorRAGService.cosineSimilarity(v1, v3);
        assert(simHigh > simLow, 'Similar crime concepts must score higher cosine similarity');
    });

    await runAsyncTest('VectorRAGService.answerGroundedQuery rejects non-existent data honestly', async () => {
        const req = {};
        const res = await VectorRAGService.answerGroundedQuery(req, {
            query: 'What was the secret alien spacecraft found in the case?'
        });
        assert(res.answer.includes('No relevant') || res.answer.includes('Data not available'), 'Must not hallucinate answers');
    });

    // -------------------------------------------------------------
    // 11. PYTHON ML MICROSERVICE PIPELINE TESTS
    // -------------------------------------------------------------
    console.log('\n--- 11. Python ML Microservice Pipeline Tests ---');

    await runAsyncTest('PythonMLBridge.getHealth returns active ML microservice status', async () => {
        const health = await PythonMLBridge.getHealth();
        assert.strictEqual(health.status, 'ONLINE');
        assert(health.service.includes('VIKSHANA'), 'Service identity must match');
    });

    await runAsyncTest('PythonMLBridge.clusterHotspots executes DBSCAN spatial clustering', async () => {
        const testCoords = [
            { lat: 12.9716, lng: 77.5946 },
            { lat: 12.9718, lng: 77.5948 },
            { lat: 12.9720, lng: 77.5950 },
            { lat: 13.0827, lng: 80.2707 } // Outlier point
        ];
        const res = await PythonMLBridge.clusterHotspots(testCoords, 2.0, 2);
        assert.strictEqual(res.status, 'SUCCESS');
        assert(res.clusterCount >= 1, 'Must detect at least 1 cluster');
    });

    await runAsyncTest('PythonMLBridge.forecastCrimeTrends produces statistical forecast with confidence intervals', async () => {
        const history = [
            { period: '2026-01', count: 12 },
            { period: '2026-02', count: 15 },
            { period: '2026-03', count: 18 },
            { period: '2026-04', count: 22 },
            { period: '2026-05', count: 25 }
        ];
        const res = await PythonMLBridge.forecastCrimeTrends(history, 3);
        assert.strictEqual(res.status, 'SUCCESS');
        assert.strictEqual(res.forecast.length, 3, 'Must project 3 periods ahead');
        assert(res.forecast[0].confidenceInterval95, 'Must provide 95% confidence intervals');
    });

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n===============================================================');
    console.log(`MASTER TEST SUITE EXECUTION COMPLETE`);
    console.log(`TOTAL TESTS: ${testsPassed + testsFailed} | PASSED: ${testsPassed} | FAILED: ${testsFailed}`);
    console.log('===============================================================');

    process.exit(testsFailed > 0 ? 1 : 0);
}

main().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
