const datastoreClient = require('../queries/datastoreClient');
const neo4jClient = require('../queries/neo4j_client');
const PythonMLBridge = require('./PythonMLBridge');
const geminiClient = require('./geminiClient');
const glmClient = require('./glmClient');
const QuickMLRAGClient = require('./QuickMLRAGClient');
const axios = require('axios');

class HealthService {
    static async getSystemHealth(req) {
        const startTime = Date.now();
        const health = {
            status: 'UP',
            timestamp: new Date().toISOString(),
            version: '2.4.0-hardened',
            uptimeSeconds: Math.floor(process.uptime()),
            environment: process.env.NODE_ENV || 'development',
            services: {
                datastore: { status: 'UNKNOWN', type: 'Zoho Catalyst DataStore' },
                neo4j: { status: neo4jClient.isConfigured() ? 'CONFIGURED' : 'UNCONFIGURED', mode: neo4jClient.isConfigured() ? 'Remote AuraDB Graph' : 'Datastore Relational Graph Fallback' },
                pythonML: { status: 'UNKNOWN', engine: 'Scikit-Learn Microservice' }
            },
            ai: {
                quickmlRag: { configured: false, status: 'NOT_CONFIGURED' },
                glm: { configured: false, status: 'NOT_CONFIGURED' },
                gemini: { configured: false, model: process.env.GEMINI_MODEL || 'gemini-3.6-flash', status: 'NOT_CONFIGURED' },
                zia: { configured: false, status: 'NOT_CONFIGURED' }
            }
        };

        // 1. Probe Datastore
        try {
            await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 1 });
            health.services.datastore.status = 'ONLINE';
        } catch (err) {
            health.services.datastore.status = 'OFFLINE_OR_UNINITIALIZED';
            health.services.datastore.detail = err.message;
        }

        // 2. Probe Python ML Microservice
        try {
            const pyHealth = await PythonMLBridge.getHealth();
            health.services.pythonML.status = pyHealth.status;
            health.services.pythonML.runtime = pyHealth.pythonVersion;
            health.services.pythonML.scikitLearn = pyHealth.scikitLearnVersion;
        } catch (err) {
            health.services.pythonML.status = 'OFFLINE';
            health.services.pythonML.detail = err.message;
        }

        // 3. Probe QuickML RAG
        if (process.env.QUICKML_RAG_ENDPOINT) {
            health.ai.quickmlRag.configured = true;
            try {
                await QuickMLRAGClient.generate([{ role: 'user', content: 'test' }]);
                health.ai.quickmlRag.status = 'HEALTHY';
            } catch (err) {
                if (err.message.includes('Auth') || err.message.includes('401') || err.message.includes('403')) {
                    health.ai.quickmlRag.status = 'AUTH_FAILED';
                } else if (err.message.includes('404')) {
                    health.ai.quickmlRag.status = 'NOT_FOUND';
                } else {
                    health.ai.quickmlRag.status = 'UNAVAILABLE';
                }
            }
        }

        // 4. Probe GLM
        if (process.env.GLM_API_KEY || process.env.CATALYST_TOKEN) {
             health.ai.glm.configured = true;
             try {
                await glmClient.generate([{ role: 'user', content: 'Respond with OK.' }]);
                health.ai.glm.status = 'HEALTHY';
             } catch (err) {
                if (err.message.includes('Auth') || err.message.includes('401') || err.message.includes('403')) {
                    health.ai.glm.status = 'AUTH_FAILED';
                } else if (err.message.includes('404') || err.message.includes('Permanent error 404')) {
                    health.ai.glm.status = 'MODEL_NOT_FOUND';
                } else {
                    health.ai.glm.status = 'UNAVAILABLE';
                }
             }
        }

        // 5. Probe Gemini
        if (process.env.GEMINI_API_KEY) {
            health.ai.gemini.configured = true;
            try {
                await geminiClient.generate([{ role: 'user', content: 'Respond with OK.' }]);
                health.ai.gemini.status = 'HEALTHY';
            } catch (err) {
                if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Auth')) {
                    health.ai.gemini.status = 'AUTH_FAILED';
                } else if (err.message.includes('404')) {
                    health.ai.gemini.status = 'MODEL_NOT_FOUND';
                } else {
                    health.ai.gemini.status = 'UNAVAILABLE';
                }
            }
        }

        // 6. Probe Zia Translation
        let ziaToken = null;
        try { ziaToken = await glmClient.getFreshAccessToken(); } catch (e) {}
        if (ziaToken) {
            health.ai.zia.configured = true;
            try {
                const orgId = process.env.CATALYST_ORG;
                if (!orgId) throw new Error("401"); // Simulate failure
                const response = await axios.post(
                    'https://api.catalyst.zoho.in/quickml/api/v1/models/zia/translate',
                    { text: 'Hello', src_lang: 'en', tgt_lang: 'kn' },
                    {
                        headers: { 'CATALYST-ORG': orgId, 'Authorization': `Zoho-oauthtoken ${ziaToken}`, 'Content-Type': 'application/json' },
                        timeout: 5000
                    }
                );
                if (response.data) health.ai.zia.status = 'HEALTHY';
                else health.ai.zia.status = 'BAD_REQUEST';
            } catch (err) {
                const status = err.response ? err.response.status : (err.message.includes('401') ? 401 : null);
                if (status === 401 || status === 403) health.ai.zia.status = 'AUTH_FAILED';
                else if (status === 400) health.ai.zia.status = 'BAD_REQUEST';
                else health.ai.zia.status = 'UNAVAILABLE';
            }
        }

        // Determine overall status
        if (health.services.datastore.status !== 'ONLINE') {
            health.status = 'DEGRADED';
        }

        health.responseTimeMs = Date.now() - startTime;
        return health;
    }
}

module.exports = HealthService;
