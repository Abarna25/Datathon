const axios = require('axios');

async function testDetect() {
    const baseUrl = 'http://localhost:3000/server/vikshana_function';
    
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(baseUrl + '/auth/login', {
            email: 'investigator',
            password: 'investigator123'
        });
        const token = loginRes.data.token;
        const headers = { 'Authorization': 'Bearer ' + token };

        console.log('\n2. Creating conversation under Case 1 (Theft)...');
        const createRes = await axios.post(baseUrl + '/conversations', {
            caseId: '1',
            title: 'Dynamic Case Detection Test'
        }, { headers });
        const convId = createRes.data.data.id;

        console.log('\n3. Sending query: "TELL ME ABT CASE STALKING REPORT"...');
        const msgRes = await axios.post(baseUrl + '/conversations/' + convId + '/messages?stream=false', {
            content: 'TELL ME ABT CASE STALKING REPORT'
        }, { headers });
        
        console.log('\nResponse content:\n', msgRes.data.data?.assistantMessage?.content);

    } catch (err) {
        console.error('Test Error:', err.response ? err.response.status + ' ' + JSON.stringify(err.response.data) : err.message);
    }
}

testDetect();
