/**
 * final_product_verification.js
 * VIKSHANA 2.0 Master Product Verification & Automated Test Orchestrator
 * 
 * Executes all 5 test suites sequentially:
 * 1. Master Production Hardening Suite
 * 2. VIKSHANA 2.0 Novelty Verification Suite
 * 3. Copilot Hallucination Defense Suite
 * 4. Live Production Comprehensive Verification Suite
 * 5. End-to-End HTTP API Integration Suite
 */

const { spawnSync } = require('child_process');
const path = require('path');

const suites = [
    { name: 'Master Hardening Suite', file: 'master_hardening_test_suite.js' },
    { name: 'VIKSHANA 2.0 Novelty Suite', file: 'vikshana_2_novelty_verification.js' },
    { name: 'Copilot Hallucination Defense Suite', file: 'copilot_hallucination_verification.js' },
    { name: 'Live Production Verification Suite', file: 'live_production_verification.js' },
    { name: 'End-to-End HTTP Integration Suite', file: 'http_integration_test_runner.js' }
];

console.log('======================================================================');
console.log('🌟 VIKSHANA 2.0 — MASTER SYSTEM VERIFICATION ORCHESTRATOR');
console.log('======================================================================\n');

let totalSuitesPassed = 0;
let totalSuitesFailed = 0;

for (let i = 0; i < suites.length; i++) {
    const suite = suites[i];
    const filePath = path.join(__dirname, suite.file);
    console.log(`[${i + 1}/${suites.length}] Executing ${suite.name} (${suite.file})...`);

    const result = spawnSync(process.execPath, [filePath], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, NODE_ENV: 'test', JWT_SECRET: 'vikshana-master-verification-secret-2026' },
        encoding: 'utf-8'
    });

    if (result.status === 0) {
        console.log(`✅ [PASS] ${suite.name} completed successfully (Exit 0)\n`);
        totalSuitesPassed++;
    } else {
        console.error(`❌ [FAIL] ${suite.name} failed with exit code ${result.status}`);
        console.error(result.stderr || result.stdout);
        totalSuitesFailed++;
    }
}

console.log('======================================================================');
console.log(`🏁 VERIFICATION SUMMARY: ${totalSuitesPassed}/${suites.length} SUITES PASSED | ${totalSuitesFailed} FAILED`);
console.log('======================================================================\n');

if (totalSuitesFailed > 0) {
    process.exit(1);
} else {
    console.log('🚀 ALL VIKSHANA 2.0 VERIFICATION ASSERTIONS PASSED WITH ZERO ERRORS!');
    process.exit(0);
}
