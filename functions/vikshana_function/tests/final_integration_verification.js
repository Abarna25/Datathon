const http = require('http');

const API_BASE = 'http://localhost:3000/server/vikshana_function';

let stats = {
    total: 0,
    passed: 0,
    failed: 0,
    failures: []
};

async function fetchJSON(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request(API_BASE + endpoint, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data, error: 'JSON Parse Error' });
                }
            });
        });

        req.on('error', reject);
        
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        
        req.end();
    });
}

async function test(name, fn) {
    stats.total++;
    try {
        await fn();
        stats.passed++;
        console.log(`[PASS] ${name}`);
    } catch (error) {
        stats.failed++;
        stats.failures.push({ name, error: error.message });
        console.error(`[FAIL] ${name} - ${error.message}`);
    }
}

function assertStr(actual, expected) {
    if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`);
}
function assertContains(actual, expectedStr) {
    if (typeof actual !== 'string') throw new Error(`Expected string, got ${typeof actual}`);
    if (!actual.includes(expectedStr)) throw new Error(`Expected string to contain '${expectedStr}'`);
}
function assertNoMock(str) {
    if (typeof str !== 'string') return;
    const lower = str.toLowerCase();
    if (lower.includes('mock') || lower.includes('demo') || lower.includes('fake') || lower.includes('dummy')) {
        throw new Error(`Data contains mock/demo string: ${str.substring(0, 50)}...`);
    }
}
function assertNoMockRecursive(obj) {
    if (!obj) return;
    if (typeof obj === 'string') return assertNoMock(obj);
    if (typeof obj === 'object') {
        for (const key of Object.keys(obj)) {
            assertNoMockRecursive(obj[key]);
        }
    }
}

async function runAll() {
    console.log("=========================================");
    console.log("Starting Final Integration Verification");
    console.log("=========================================\n");

    // CORE PLATFORM
    await test("Dashboard (Core)", async () => {
        const res = await fetchJSON('/dashboard/');
        if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
        if (!res.data.success) throw new Error("Dashboard success=false");
        assertNoMockRecursive(res.data);
    });

    await test("Case Listing (/cases)", async () => {
        const res = await fetchJSON('/cases?page=1&limit=5');
        if (!res.data.success || !Array.isArray(res.data.data)) throw new Error("Invalid schema");
        assertNoMockRecursive(res.data);
    });

    await test("Open Case (/cases/53/full-bundle)", async () => {
        const res = await fetchJSON('/cases/53/full-bundle');
        if (!res.data.success) throw new Error("Failed to open case 53");
        if (!res.data.data.caseNumber) throw new Error("Missing caseNumber");
        assertNoMockRecursive(res.data);
    });

    // INTELLIGENCE
    await test("Relationship Graph (/relationships?caseId=53)", async () => {
        const res = await fetchJSON('/relationships?caseId=53');
        if (!res.data.success) throw new Error("Failed graph");
        assertNoMockRecursive(res.data);
    });

    await test("Similar Case Discovery (/decision/similar-cases?caseId=53)", async () => {
        const res = await fetchJSON('/decision/similar-cases?caseId=53');
        if (!res.data.success) throw new Error("Failed similar cases");
        assertNoMockRecursive(res.data);
    });

    await test("Copilot Context (/evidence-intelligence/workspace?caseId=53)", async () => {
        const res = await fetchJSON('/evidence-intelligence/workspace?caseId=53');
        if (!res.data.success) throw new Error("Failed workspace context");
        assertNoMockRecursive(res.data);
    });

    await test("Copilot Chat (/evidence-intelligence/copilot)", async () => {
        const res = await fetchJSON('/evidence-intelligence/copilot', {
            method: 'POST',
            body: { caseId: "53", prompt: "Who are the suspects?" }
        });
        if (!res.data.success) throw new Error("Chat failed");
        assertNoMockRecursive(res.data);
    });

    // FINALIST FEATURES
    await test("Crime Trend Analytics (/forecasting/dashboard)", async () => {
        const res = await fetchJSON('/forecasting/dashboard');
        if (!res.data.success) throw new Error("Failed crime trends");
        assertNoMockRecursive(res.data);
    });

    await test("Hotspot Analytics (/forecasting/hotspots)", async () => {
        const res = await fetchJSON('/forecasting/hotspots');
        if (!res.data.success) throw new Error("Failed hotspots");
        assertNoMockRecursive(res.data);
    });

    await test("Early Warning Intelligence (/forecasting/early-warning)", async () => {
        const res = await fetchJSON('/forecasting/early-warning');
        if (!res.data.success) throw new Error("Failed early warnings");
        assertNoMockRecursive(res.data);
    });

    await test("Offender Profiling List (/offender/list)", async () => {
        const res = await fetchJSON('/offender/list');
        if (!res.data.success) throw new Error("Failed offender list");
        assertNoMockRecursive(res.data);
    });

    await test("Investigation Report (/reports/generate)", async () => {
        const res = await fetchJSON('/reports/generate', {
            method: 'POST',
            body: { caseId: "53" }
        });
        if (!res.data.success) throw new Error("Failed report generation");
        assertNoMockRecursive(res.data);
    });

    // SAFETY & EDGE CASES
    await test("Non-existent case ID (/cases/999999/full-bundle)", async () => {
        const res = await fetchJSON('/cases/999999/full-bundle');
        if (res.data.success) throw new Error("Should not succeed on 999999");
    });

    await test("SQL Injection Attempt (/cases/1' OR '1'='1/full-bundle)", async () => {
        const res = await fetchJSON('/cases/1%27%20OR%20%271%27=%271/full-bundle');
        if (res.data.success) throw new Error("Should reject or gracefully fail SQLi");
    });

    console.log("\n=========================================");
    console.log(`Results: ${stats.passed}/${stats.total} Passed, ${stats.failed} Failed`);
    if (stats.failed > 0) {
        console.log("\nFailures:");
        stats.failures.forEach(f => console.log(`- ${f.name}: ${f.error}`));
    }
    console.log("=========================================\n");
}

runAll();
