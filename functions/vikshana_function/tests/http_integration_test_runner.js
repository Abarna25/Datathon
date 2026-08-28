/**
 * http_integration_test_runner.js
 * End-to-End HTTP API Integration Test Runner for VIKSHANA.
 * Boots an in-process Express HTTP server on an ephemeral port,
 * executes genuine HTTP network requests with real JWT headers,
 * and validates HTTP status codes, headers, and payloads.
 */

const http = require('http');
const assert = require('assert');

process.env.JWT_SECRET = 'vikshana-http-integration-jwt-secret-2026';
process.env.NODE_ENV = 'test';

const app = require('../index');

let server = null;
let port = 9088;
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

async function asyncTest(name, fn) {
    try {
        await fn();
        logPass(name);
    } catch (e) {
        logFail(name, e);
    }
}

function makeRequest(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const reqHeaders = {
            'Content-Type': 'application/json',
            ...headers
        };
        if (payload) {
            reqHeaders['Content-Length'] = Buffer.byteLength(payload);
        }

        const req = http.request({
            hostname: '127.0.0.1',
            port,
            path,
            method,
            headers: reqHeaders
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                let parsed = data;
                try {
                    parsed = JSON.parse(data);
                } catch (_) {}
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: parsed
                });
            });
        });

        req.on('error', (err) => reject(err));
        if (payload) {
            req.write(payload);
        }
        req.end();
    });
}

async function runHTTPTests() {
    console.log('===============================================================');
    console.log('VIKSHANA END-TO-END HTTP API INTEGRATION TEST SUITE');
    console.log('===============================================================\n');

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
    console.log(`[Test Server] Live Express server listening on http://127.0.0.1:${port}\n`);

    let adminToken = null;
    let officerToken = null;

    // 1. PUBLIC OBSERVABILITY
    console.log('--- 1. Public Observability Endpoint ---');
    await asyncTest('GET /health returns HTTP 200 and subsystem telemetry', async () => {
        const res = await makeRequest('GET', '/health');
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert(res.data.status === 'UP' || res.data.status === 'DEGRADED');
        assert(res.data.services.pythonML !== undefined);
        assert(res.data.services.neo4j !== undefined);
    });

    // 2. AUTHENTICATION & TOKEN ISSUANCE
    console.log('\n--- 2. Authentication & Token Issuance ---');
    await asyncTest('POST /auth/login with Admin credentials returns HTTP 200 & JWT', async () => {
        const res = await makeRequest('POST', '/auth/login', { email: 'admin', password: 'admin123' });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert(res.data.token);
        assert.strictEqual(res.data.user.role, 'Administrator');
        adminToken = res.data.token;
    });

    await asyncTest('POST /auth/login with Officer credentials returns HTTP 200 & JWT', async () => {
        const res = await makeRequest('POST', '/auth/login', { email: 'officer', password: 'password123' });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert(res.data.token);
        assert.strictEqual(res.data.user.role, 'Officer');
        officerToken = res.data.token;
    });

    await asyncTest('POST /auth/login with wrong password returns HTTP 401 Unauthorized', async () => {
        const res = await makeRequest('POST', '/auth/login', { email: 'officer', password: 'bad_password' });
        assert.strictEqual(res.status, 401);
        assert.strictEqual(res.data.success, false);
    });

    // 3. RBAC & SECURITY ENFORCEMENT
    console.log('\n--- 3. Role-Based Access Control (RBAC) Over HTTP ---');
    await asyncTest('GET /audit/logs without token returns HTTP 401 Unauthorized', async () => {
        const res = await makeRequest('GET', '/audit/logs');
        assert.strictEqual(res.status, 401);
    });

    await asyncTest('GET /audit/logs with Officer token returns HTTP 403 Forbidden', async () => {
        const res = await makeRequest('GET', '/audit/logs', null, {
            Authorization: `Bearer ${officerToken}`
        });
        assert.strictEqual(res.status, 403);
    });

    await asyncTest('GET /audit/logs with Admin token returns HTTP 200 OK', async () => {
        const res = await makeRequest('GET', '/audit/logs', null, {
            Authorization: `Bearer ${adminToken}`
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
    });

    await asyncTest('POST /auth/users with Officer token is rejected with HTTP 403 Forbidden', async () => {
        const res = await makeRequest('POST', '/auth/users', {
            username: 'test_escalate',
            password: 'pass',
            role: 'Administrator'
        }, {
            Authorization: `Bearer ${officerToken}`
        });
        assert.strictEqual(res.status, 403);
    });

    await asyncTest('POST /auth/users with Admin token provisions user with HTTP 201 Created', async () => {
        const res = await makeRequest('POST', '/auth/users', {
            username: 'subinspector_e2e',
            password: 'SecurePassword123!',
            role: 'Investigator',
            name: 'SI E2E Officer',
            department: 'CID Cyber Unit'
        }, {
            Authorization: `Bearer ${adminToken}`
        });
        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.data.username, 'subinspector_e2e');
    });

    // 4. FORENSIC DOMAINS OVER HTTP
    console.log('\n--- 4. Forensic Domain Ingestion Over HTTP ---');
    await asyncTest('POST /forensics/evidence creates item and returns SHA-256 hash', async () => {
        const res = await makeRequest('POST', '/forensics/evidence', {
            caseMasterId: '101',
            evidenceType: 'Digital Media',
            description: 'Encrypted drive seized at checkpoint',
            storageLocation: 'Vault-01'
        }, {
            Authorization: `Bearer ${officerToken}`
        });
        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.data.FileHash.length, 64);
    });

    await asyncTest('POST /forensics/financial flags structuring on high-value transaction', async () => {
        const res = await makeRequest('POST', '/forensics/financial', {
            caseMasterId: '101',
            sourceAccount: 'AC-100293',
            destinationAccount: 'AC-993821',
            amount: 800000,
            bankName: 'SBI Bank'
        }, {
            Authorization: `Bearer ${officerToken}`
        });
        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.data.IsSuspicious, 'YES');
    });

    await asyncTest('POST /forensics/cctv records metadata and returns 201 Created', async () => {
        const res = await makeRequest('POST', '/forensics/cctv', {
            caseMasterId: '101',
            cameraId: 'CAM-IND-01',
            location: 'Indiranagar 100ft Road',
            description: 'Footage segment near traffic signal'
        }, {
            Authorization: `Bearer ${officerToken}`
        });
        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.success, true);
    });

    await asyncTest('POST /forensics/cdr records call details and returns 201 Created', async () => {
        const res = await makeRequest('POST', '/forensics/cdr', {
            caseMasterId: '101',
            callerPhone: '+919988112233',
            receiverPhone: '+919944001122',
            durationSeconds: 180,
            cellTowerLocation: 'Tower 4'
        }, {
            Authorization: `Bearer ${officerToken}`
        });
        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.success, true);
    });

    await asyncTest('POST /forensics/weapons records weapon seizure and returns 201 Created', async () => {
        const res = await makeRequest('POST', '/forensics/weapons', {
            caseMasterId: '101',
            weaponType: 'Firearm',
            makeModel: 'Revolver .38',
            caliberSerialNo: 'REV-38-0099',
            recoveryLocation: 'Under bridge'
        }, {
            Authorization: `Bearer ${officerToken}`
        });
        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.success, true);
    });

    await asyncTest('POST /forensics/vehicles records vehicle impound and returns 201 Created', async () => {
        const res = await makeRequest('POST', '/forensics/vehicles', {
            caseMasterId: '101',
            registrationNo: 'KA-01-AB-9988',
            vehicleType: 'Sedan',
            make: 'Honda',
            model: 'City',
            color: 'Silver'
        }, {
            Authorization: `Bearer ${officerToken}`
        });
        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.success, true);
    });

    await asyncTest('POST /forensics/biometrics records biometric reference and returns 201 Created', async () => {
        const res = await makeRequest('POST', '/forensics/biometrics', {
            caseMasterId: '101',
            biometricType: 'DNA_PROFILE_REF',
            referenceId: 'DNA-REF-2026-9901-KA',
            matchSource: 'State DNA Registry',
            matchConfidence: 99.9
        }, {
            Authorization: `Bearer ${officerToken}`
        });
        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.success, true);
    });

    await asyncTest('POST /forensics/court records judicial hearing order and returns 201 Created', async () => {
        const res = await makeRequest('POST', '/forensics/court', {
            caseMasterId: '101',
            courtId: 'C-BALLARI-02',
            judgeName: 'Hon. Magistrate S. Roy',
            hearingStage: 'Charge Framing',
            courtOrder: 'Charges framed under Sec 302 IPC'
        }, {
            Authorization: `Bearer ${officerToken}`
        });
        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.success, true);
    });

    await asyncTest('POST /forensics/reports records FSL report and returns 201 Created', async () => {
        const res = await makeRequest('POST', '/forensics/reports', {
            caseMasterId: '101',
            forensicType: 'Toxicology',
            laboratoryName: 'SFSL Bengaluru',
            expertName: 'Dr. V. Rao',
            findingsSummary: 'No lethal traces found in blood specimen.'
        }, {
            Authorization: `Bearer ${officerToken}`
        });
        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.success, true);
    });

    await asyncTest('POST /forensics/interrogations records custodial admissions and returns 201 Created', async () => {
        const res = await makeRequest('POST', '/forensics/interrogations', {
            caseMasterId: '101',
            accusedMasterId: '201',
            summary: 'Subject explained sequence of movements.',
            keyAdmissions: 'Admitted presence at warehouse.'
        }, {
            Authorization: `Bearer ${officerToken}`
        });
        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.success, true);
    });

    // 5. VECTOR RAG & ML OVER HTTP
    console.log('\n--- 5. Vector RAG Semantic Retrieval Over HTTP ---');
    await asyncTest('POST /forensics/rag/query performs vector search and returns grounded response', async () => {
        const res = await makeRequest('POST', '/forensics/rag/query', {
            query: 'Explain findings in FIR brief facts and evidence records'
        }, {
            Authorization: `Bearer ${officerToken}`
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert(res.data.data.citations !== undefined);
        assert(res.data.data.answer !== undefined);
    });

    console.log('\n--- 6. Python ML Pipeline Over HTTP ---');
    await asyncTest('POST /ml/pipeline/hotspots runs real DBSCAN spatial clustering', async () => {
        const res = await makeRequest('POST', '/ml/pipeline/hotspots', {
            coordinates: [
                { lat: 12.9716, lng: 77.5946 },
                { lat: 12.9717, lng: 77.5947 },
                { lat: 12.9718, lng: 77.5948 }
            ],
            epsKm: 2.0,
            minSamples: 2
        }, {
            Authorization: `Bearer ${officerToken}`
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.data.status, 'SUCCESS');
        assert(res.data.data.clusterCount >= 1);
    });

    await asyncTest('POST /ml/pipeline/forecast projects time-series trends with confidence intervals', async () => {
        const res = await makeRequest('POST', '/ml/pipeline/forecast', {
            historicalCounts: [
                { period: '2026-01', count: 12 },
                { period: '2026-02', count: 16 },
                { period: '2026-03', count: 19 },
                { period: '2026-04', count: 24 }
            ],
            periodsAhead: 2
        }, {
            Authorization: `Bearer ${officerToken}`
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.data.status, 'SUCCESS');
        assert.strictEqual(res.data.data.forecast.length, 2);
    });

    // Clean up
    await new Promise((resolve) => server.close(resolve));
    console.log('\n[Test Server] In-process Express server closed cleanly.');

    console.log('\n===============================================================');
    console.log(`HTTP INTEGRATION SUITE COMPLETE`);
    console.log(`TOTAL HTTP CHECKS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
    console.log('===============================================================');

    process.exit(failedCount > 0 ? 1 : 0);
}

runHTTPTests().catch((err) => {
    console.error('Fatal HTTP test runner error:', err);
    if (server) server.close();
    process.exit(1);
});
