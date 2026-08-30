require('dotenv').config();
const quickMLClient = require('./services/QuickMLRAGClient');

async function testQuickML() {
    console.log("==========================================");
    console.log("🧪 TESTING QUICKML RAG ENDPOINT (GLM-4.7)");
    console.log("==========================================");

    const testMessages = [
        { role: 'system', content: 'You are an AI investigator.' },
        { role: 'user', content: 'Evidence Ledger:\nCase ID: FIR-101\nVictim: John Doe\nCrime: Burglary' },
        { role: 'user', content: 'Who is the victim in this case?' }
    ];

    try {
        console.log("Sending payload to:", quickMLClient.endpoint);
        console.log("Using ORG ID:", quickMLClient.org || '60077000408');
        
        const startTime = Date.now();
        const response = await quickMLClient.generate(testMessages);
        const duration = Date.now() - startTime;

        console.log("\n✅ SUCCESS! (Took " + duration + "ms)");
        console.log("------------------------------------------");
        console.log("AI Answer:", response.content);
        console.log("------------------------------------------");

    } catch (error) {
        console.log("\n❌ FAILED TO CONNECT");
        console.log("------------------------------------------");
        console.error("Reason:", error.message);
        if (error.message.includes('token missing')) {
            console.log("\n💡 FIX: Ensure CATALYST_TOKEN or GLM_API_KEY is set in functions/vikshana_function/.env");
        }
    }
}

testQuickML();
