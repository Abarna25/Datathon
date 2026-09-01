const http = require('http');
const fs = require('fs');
const path = require('path');

// Setup Configuration
const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}`;

let authToken = '';

function postLogin() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ email: 'admin', password: 'admin123' });
        const req = http.request({
            hostname: 'localhost',
            port: PORT,
            path: '/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.success && parsed.token) {
                        resolve(parsed.token);
                    } else {
                        reject(new Error(parsed.error || 'Login failed'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

const ENDPOINTS = [
    { name: 'GET /health', path: '/health', auth: false, method: 'GET' },
    { name: 'GET /dashboard', path: '/dashboard', auth: true, method: 'GET' },
    { name: 'GET /cases', path: '/cases', auth: true, method: 'GET' },
    { name: 'GET /forensics/evidence/case/100070382202100001', path: '/forensics/evidence/case/100070382202100001', auth: true, method: 'GET' },
    { name: 'GET /audit', path: '/audit', auth: true, method: 'GET' },
    { name: 'GET /intelligence/forecast/overview', path: '/intelligence/forecast/overview', auth: true, method: 'GET' },
];

const NUM_REQUESTS_PER_ENDPOINT = 20;

function makeRequest(endpoint) {
    return new Promise((resolve) => {
        const start = Date.now();
        const url = new URL(`${BASE_URL}${endpoint.path}`);

        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: endpoint.method,
            headers: {}
        };

        if (endpoint.auth && authToken) {
            options.headers['Authorization'] = `Bearer ${authToken}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const latency = Date.now() - start;
                resolve({
                    statusCode: res.statusCode,
                    latency,
                    success: res.statusCode >= 200 && res.statusCode < 400
                });
            });
        });

        req.on('error', (err) => {
            const latency = Date.now() - start;
            resolve({
                statusCode: 500,
                latency,
                success: false,
                error: err.message
            });
        });

        req.end();
    });
}

async function runBenchmark() {
    console.log('===============================================================');
    console.log('VIKSHANA REAL API PERFORMANCE BENCHMARK SUITE');
    console.log(`Target: ${BASE_URL} | Requests/Endpoint: ${NUM_REQUESTS_PER_ENDPOINT}`);
    console.log('===============================================================\n');

    try {
        console.log('Authenticating Admin user via POST /auth/login...');
        authToken = await postLogin();
        console.log('✓ Authentication successful. Token obtained.\n');
    } catch (e) {
        console.error('Failed to obtain JWT token:', e.message);
    }

    const results = {};
    const startTimeOverall = Date.now();

    for (const ep of ENDPOINTS) {
        console.log(`Benchmarking ${ep.name}...`);
        const latencies = [];
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < NUM_REQUESTS_PER_ENDPOINT; i++) {
            const res = await makeRequest(ep);
            latencies.push(res.latency);
            if (res.success) successCount++;
            else failCount++;
        }

        latencies.sort((a, b) => a - b);
        const avg = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2);
        const p50 = latencies[Math.floor(latencies.length * 0.5)];
        const p95 = latencies[Math.floor(latencies.length * 0.95)];
        const p99 = latencies[latencies.length - 1];

        results[ep.name] = {
            endpoint: ep.name,
            totalRequests: NUM_REQUESTS_PER_ENDPOINT,
            successCount,
            failCount,
            errorRatePct: ((failCount / NUM_REQUESTS_PER_ENDPOINT) * 100).toFixed(1) + '%',
            avgLatencyMs: Number(avg),
            p50LatencyMs: p50,
            p95LatencyMs: p95,
            p99LatencyMs: p99
        };

        console.log(`  ✓ Success: ${successCount}/${NUM_REQUESTS_PER_ENDPOINT} | Avg: ${avg}ms | P50: ${p50}ms | P95: ${p95}ms | P99: ${p99}ms`);
    }

    const totalDurationSec = ((Date.now() - startTimeOverall) / 1000).toFixed(2);
    const totalReqs = ENDPOINTS.length * NUM_REQUESTS_PER_ENDPOINT;
    const rps = (totalReqs / Number(totalDurationSec)).toFixed(1);

    const summaryReport = {
        benchmarkDate: new Date().toISOString(),
        environment: 'Localhost Prototype / Node.js 20.x Express Serverless Core',
        totalRequestsExecuted: totalReqs,
        totalDurationSeconds: Number(totalDurationSec),
        overallRequestsPerSecond: Number(rps),
        endpointResults: results
    };

    // Ensure directory exists
    const docsDir = path.join(__dirname, '..', '..', 'docs', 'benchmarks');
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }

    // Save JSON output
    fs.writeFileSync(
        path.join(docsDir, 'benchmark-results.json'),
        JSON.stringify(summaryReport, null, 2)
    );

    // Save Markdown report
    let mdContent = `# VIKSHANA API Performance Benchmark Report\n\n`;
    mdContent += `**Date Executed**: ${summaryReport.benchmarkDate}\n`;
    mdContent += `**Environment**: ${summaryReport.environment}\n`;
    mdContent += `**Total Requests Executed**: ${summaryReport.totalRequestsExecuted}\n`;
    mdContent += `**Execution Time**: ${summaryReport.totalDurationSeconds}s\n`;
    mdContent += `**Throughput**: ${summaryReport.overallRequestsPerSecond} requests/sec\n\n`;

    mdContent += `### Endpoint Latency Breakdown\n\n`;
    mdContent += `| Endpoint | Total Requests | Success Rate | Avg Latency (ms) | P50 (ms) | P95 (ms) | P99 (ms) |\n`;
    mdContent += `|---|---|---|---|---|---|---|\n`;

    for (const key of Object.keys(results)) {
        const r = results[key];
        mdContent += `| \`${r.endpoint}\` | ${r.totalRequests} | ${(100 - parseFloat(r.errorRatePct)).toFixed(1)}% | ${r.avgLatencyMs} | ${r.p50LatencyMs} | ${r.p95LatencyMs} | ${r.p99LatencyMs} |\n`;
    }

    mdContent += `\n*Note: Measured empirically on local development environment with Node 20.x and 50,005 KSP dataset records loaded into memory.*`;

    fs.writeFileSync(path.join(docsDir, 'benchmark-report.md'), mdContent);

    console.log('\n===============================================================');
    console.log(`BENCHMARK COMPLETE IN ${totalDurationSec}s (${rps} req/sec)`);
    console.log(`Results saved to: docs/benchmarks/benchmark-results.json & docs/benchmarks/benchmark-report.md`);
    console.log('===============================================================');
}

runBenchmark();
