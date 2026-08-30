async function testAllAgents() {
    console.log("🚀 Initializing VIKSHANA Agentic Testing Protocol...");
    
    const token = localStorage.getItem('vikshana_auth_token');
    const headers = {
        'Content-Type': 'application/json',
        'X-Vikshana-Auth': `Bearer ${token}`
    };

    const caseId = "CASE-DEMO-001"; // Generic case ID for testing

    const tests = [
        {
            name: "🧠 1. VIKSHANA Copilot Agent",
            url: "/server/vikshana_function/evidence-intelligence/copilot",
            payload: { message: "Summarize the key suspects in this case.", caseId }
        },
        {
            name: "🔗 2. Evidence Correlation Agent",
            url: "/server/vikshana_function/forensics/rag/query",
            payload: { query: "Connect the CCTV footage with the phone records.", caseId }
        },
        {
            name: "📊 3. Predictive ML Agent (Risk Hotspots)",
            url: "/server/vikshana_function/ml/pipeline/hotspots",
            payload: { region: "Bangalore", timeframe: "30_days" }
        },
        {
            name: "⚖️ 4. Decision Support & Hypothesis Agent",
            url: "/server/vikshana_function/decision/executive-summary",
            payload: { caseId }
        }
    ];

    for (const test of tests) {
        console.log(`\n=================================================`);
        console.log(`Testing: ${test.name}`);
        console.log(`Endpoint: ${test.url}`);
        console.log(`=================================================`);
        
        try {
            const response = await fetch(test.url, {
                method: 'POST',
                headers,
                body: JSON.stringify(test.payload)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                console.log("✅ AGENT RESPONSE: SUCCESS");
                console.log(data.data || data.answer || data.summary || "Action completed.");
            } else {
                console.log("❌ AGENT RESPONSE: FAILED (Expected if mock data is missing)");
                console.log(data.error || "Unknown Error");
            }
        } catch (err) {
            console.error("🚨 NETWORK ERROR:", err.message);
        }
    }
    
    console.log(`\n🎉 VIKSHANA Agentic Testing Suite Completed!`);
}

// Execute the test suite
testAllAgents();
