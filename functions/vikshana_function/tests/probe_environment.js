/**
 * probe_environment.js
 * Probes environment connectivity for Zia NLP translation and GLM endpoints.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const axios = require('axios');

async function probe() {
    console.log('--- Environment Variable Status ---');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'CONFIGURED' : 'MISSING');
    console.log('PBKDF2_ITERATIONS:', process.env.PBKDF2_ITERATIONS || 'DEFAULT(210000)');
    console.log('CATALYST_ORG:', process.env.CATALYST_ORG ? 'CONFIGURED' : 'MISSING');
    console.log('CATALYST_TOKEN:', process.env.CATALYST_TOKEN ? 'CONFIGURED' : 'MISSING');
    console.log('NEO4J_URI:', process.env.NEO4J_URI ? 'CONFIGURED' : 'MISSING');

    // 1. Probe Zia Translation API
    console.log('\n--- Probing Zia NLP Translation API ---');
    const ziaUrl = 'https://api.catalyst.zoho.in/quickml/api/v1/models/zia/translate';
    try {
        const res = await axios.post(
            ziaUrl,
            { text: 'Investigation report received.', src_lang: 'en', tgt_lang: 'kn' },
            {
                headers: {
                    'CATALYST-ORG': process.env.CATALYST_ORG,
                    'Authorization': `Zoho-oauthtoken ${process.env.CATALYST_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                timeout: 8000
            }
        );
        console.log('[Zia NLP Live Probe] Status:', res.status);
        console.log('[Zia NLP Live Probe] Output:', res.data);
    } catch (err) {
        console.log('[Zia NLP Live Probe] Failed/Unavailable:', err.response?.status || err.message);
        if (err.response?.data) console.log('[Zia NLP Error Payload]:', err.response.data);
    }

    // 2. Probe GLM Endpoint
    console.log('\n--- Probing GLM Endpoint ---');
    try {
        const glmRes = await axios.post(
            process.env.GLM_ENDPOINT,
            {
                model: process.env.GLM_MODEL,
                messages: [{ role: 'user', content: 'Say hello in 3 words' }],
                temperature: 0.1
            },
            {
                headers: {
                    'CATALYST-ORG': process.env.CATALYST_ORG,
                    'Authorization': `Zoho-oauthtoken ${process.env.CATALYST_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                timeout: 8000
            }
        );
        console.log('[GLM Live Probe] Status:', glmRes.status);
        console.log('[GLM Live Probe] Output:', glmRes.data);
    } catch (err) {
        console.log('[GLM Live Probe] Failed/Unavailable:', err.response?.status || err.message);
        if (err.response?.data) console.log('[GLM Error Payload]:', err.response.data);
    }
}

probe().catch(console.error);
