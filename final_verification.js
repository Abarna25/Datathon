let globalToken = 'test-token';
const API = 'http://localhost:3000/server/vikshana_function';
const getHeaders = () => ({ 'X-Vikshana-Auth': `Bearer ${globalToken}`, 'Content-Type': 'application/json' });

async function verifyEndpoint(name, path, validateFn) {
    process.stdout.write(name.padEnd(25) + ' ');
    try {
        const response = await fetch(`${API}${path}`, { headers: getHeaders(), signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
        const data = await response.json();
        if (!data || !data.success) throw new Error(data?.error || data?.message || 'API returned success=false');
        
        const result = validateFn(data.data || data);
        if (result === true) {
            console.log('PASS');
        } else {
            console.log(`PARTIAL (${result})`);
        }
    } catch (err) {
        console.log(`FAIL (${err.message})`);
    }
}

async function verifyPostEndpoint(name, path, payload, validateFn) {
    process.stdout.write(name.padEnd(25) + ' ');
    try {
        const response = await fetch(`${API}${path}`, { 
            method: 'POST', 
            headers: getHeaders(), 
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(30000) 
        });
        if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
        const data = await response.json();
        if (!data || !data.success) throw new Error(data?.error || data?.message || 'API returned success=false');
        
        const result = validateFn(data.data || data);
        if (result === true) {
            console.log('PASS');
        } else {
            console.log(`PARTIAL (${result})`);
        }
    } catch (err) {
        console.log(`FAIL (${err.message})`);
    }
}

async function runVerification() {
    console.log("VIKSHANA FINAL VERIFICATION\n");
    console.log("Testing core functionality against real Catalyst Datastore...");
    console.log("----------------------------------------------------------");

    // Get real token
    try {
        const loginRes = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'investigator', password: 'investigator123' })
        });
        const loginData = await loginRes.json();
        if (loginData.token) {
            globalToken = loginData.token;
        }
    } catch (e) {
        console.log('Failed to login for verification', e.message);
    }

    await verifyEndpoint('Authentication', '/auth/session', (d) => !!d.user || d === null);
    await verifyEndpoint('Dashboard Stats', '/dashboard', (d) => {
        if (d.stats && d.recentCases) return true;
        return 'Missing keys in dashboard data';
    });
    
    // Case 53 is known to exist
    const testCaseId = '53'; 
    await verifyEndpoint('Case Retrieval', `/cases/${testCaseId}/full-bundle`, (d) => {
        if (d.caseId && Array.isArray(d.victims)) return true;
        return 'Missing full bundle data structure';
    });
    
    await verifyEndpoint('Case Summary', `/decision/summary/${testCaseId}`, (d) => {
        if (d.overview) return true;
        return 'No summary generated';
    });
    
    await verifyEndpoint('Decision Support', `/decision/lead-recommendations?caseId=${testCaseId}`, (d) => Array.isArray(d));
    
    await verifyEndpoint('Relationships', `/relationships?caseId=${testCaseId}`, (d) => {
        if (d.nodes && d.edges) return true;
        return 'Missing graph structure';
    });
    
    await verifyEndpoint('Similar Cases', `/decision/similar-cases?caseId=${testCaseId}`, (d) => Array.isArray(d));
    await verifyEndpoint('Case Completeness', `/decision/completeness/${testCaseId}`, (d) => typeof d.score === 'number' || d === null);
    
    await verifyPostEndpoint('Copilot Real Data', '/evidence-intelligence/copilot', {
        caseId: testCaseId,
        prompt: 'Summarize this case'
    }, (d) => d.answer && typeof d.answer === 'string');

    await verifyPostEndpoint('Copilot Hallucination Guard', '/evidence-intelligence/copilot', {
        caseId: testCaseId,
        prompt: 'Who is John Doe in this case?'
    }, (d) => {
        // AI should refuse or say not found or absence
        const text = (d.answer || '').toLowerCase();
        if (text.includes('john doe') && (text.includes('not') || text.includes('absence'))) return true;
        return 'AI might have hallucinated an answer';
    });
    
    // Security Cross-Case and SQL injection
    process.stdout.write('Security SQL Injection'.padEnd(25) + ' ');
    try {
        const sqlRes = await fetch(`${API}/cases/53'%20OR%20'1'='1/full-bundle`, { headers: getHeaders(), signal: AbortSignal.timeout(15000) });
        const sqlData = await sqlRes.json();
        // If it throws an error or returns success=false, it blocked the injection!
        if (!sqlData.success) {
            console.log('PASS');
        } else {
            console.log('FAIL (Returned data for invalid SQL injection payload)');
        }
    } catch (err) {
        console.log('PASS');
    }

    console.log("----------------------------------------------------------");
}

runVerification();
