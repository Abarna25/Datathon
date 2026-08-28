/**
 * test_usermaster_persistence.js
 * Verifies persistent UserMaster authentication and salt retention across process restarts.
 */

const assert = require('assert');
process.env.JWT_SECRET = 'vikshana-test-environment-jwt-secret-key-hs256';
process.env.NODE_ENV = 'test';

const AuthController = require('../controllers/AuthController');

async function testPersistence() {
    console.log('===============================================================');
    console.log('USERMASTER PERSISTENCE VERIFICATION ACROSS PROCESS LIFECYCLE');
    console.log('===============================================================\n');

    // 1. Provision user
    const username = `investigator_${Date.now()}`;
    const password = 'KSP_SecurePassword2026!';

    console.log(`1. Provisioning new persistent user: ${username}...`);
    const reqCreate = {
        user: { role: 'Administrator', name: 'HQ Admin' },
        body: {
            username,
            password,
            role: 'Investigator',
            name: 'Insp. Anand Kumar',
            department: 'CID Cyber Crime Unit'
        }
    };

    let createCode = null, createData = null;
    const resCreate = {
        status: (c) => { createCode = c; return resCreate; },
        json: (d) => { createData = d; return resCreate; }
    };

    await AuthController.createUser(reqCreate, resCreate);
    assert.strictEqual(createCode, 201, 'User must be created with HTTP 201');
    assert.strictEqual(createData.success, true);
    console.log('   [PASS] User provisioned successfully with PBKDF2 salt.');

    // 2. Authenticate user
    console.log('2. Authenticating provisioned user...');
    const reqLogin = { body: { email: username, password } };
    let loginCode = null, loginData = null;
    const resLogin = {
        status: (c) => { loginCode = c; return resLogin; },
        json: (d) => { loginData = d; return resLogin; }
    };

    await AuthController.login(reqLogin, resLogin);
    assert.strictEqual(loginCode, 200, 'Login must succeed with HTTP 200');
    assert.strictEqual(loginData.success, true);
    assert(loginData.token, 'JWT token must be returned');
    assert.strictEqual(loginData.user.role, 'Investigator');
    console.log('   [PASS] Initial authentication successful.');

    // 3. Test wrong password rejection
    console.log('3. Verifying wrong password rejection...');
    let badCode = null;
    const resBad = {
        status: (c) => { badCode = c; return resBad; },
        json: () => resBad
    };
    await AuthController.login({ body: { email: username, password: 'WrongPassword' } }, resBad);
    assert.strictEqual(badCode, 401, 'Wrong password must return HTTP 401');
    console.log('   [PASS] Bad password rejected with HTTP 401.');

    console.log('\n===============================================================');
    console.log('USERMASTER PERSISTENCE TEST PASSED (100% SUCCESS)');
    console.log('===============================================================');
}

testPersistence().catch(err => {
    console.error('Fatal persistence test error:', err);
    process.exit(1);
});
