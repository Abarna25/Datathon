require('dotenv').config();
const axios = require('axios');

async function test() {
    try {
        const payload = {
            model: process.env.GLM_MODEL,
            messages: [{ role: 'user', content: 'Say hello in 3 words' }],
            temperature: 0.1,
            max_tokens: 1024,
            chat_template_kwargs: {
                enable_thinking: true
            }
        };
        const token = process.env.CATALYST_TOKEN;
        console.log('Using Token:', token);
        console.log('Using Endpoint:', process.env.GLM_ENDPOINT);
        console.log('Using Org:', process.env.CATALYST_ORG);
        
        const response = await axios.post(process.env.GLM_ENDPOINT, payload, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`,
                'CATALYST-ORG': process.env.CATALYST_ORG || '',
                'Content-Type': 'application/json'
            }
        });
        console.log('Success! Response:', response.data);
    } catch (e) {
        console.error('API Error Status:', e.response ? e.response.status : 'No Status');
        console.error('API Error Response:', e.response ? JSON.stringify(e.response.data) : e.message);
    }
}

test();
