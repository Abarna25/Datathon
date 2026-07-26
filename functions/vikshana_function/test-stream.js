const axios = require('axios');

async function test() {
    const baseUrl = 'http://localhost:3000/server/vikshana_function';
    
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(baseUrl + '/auth/login', {
            email: 'investigator',
            password: 'investigator123'
        });
        const token = loginRes.data.token;
        const headers = { 
            'Authorization': 'Bearer ' + token,
            'Accept': 'text/event-stream'
        };

        console.log('\n2. Creating conversation...');
        const createRes = await axios.post(baseUrl + '/conversations', {
            caseId: '100080405202100001',
            title: 'Streaming Test'
        }, { headers: { 'Authorization': 'Bearer ' + token } });
        const convId = createRes.data.data.id;

        console.log('\n3. Sending streaming query...');
        const response = await axios({
            method: 'post',
            url: `${baseUrl}/conversations/${convId}/messages?stream=true`,
            data: { content: 'hello' },
            headers,
            responseType: 'stream'
        });

        console.log('Stream started! Status:', response.status);
        response.data.on('data', chunk => {
            console.log('CHUNK:', chunk.toString());
        });
        response.data.on('end', () => {
            console.log('Stream ended.');
        });

    } catch (err) {
        console.error('Test Error:', err.message);
    }
}

test();
