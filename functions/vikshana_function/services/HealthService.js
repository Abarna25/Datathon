const datastoreClient = require('../queries/datastoreClient');
const neo4jClient = require('../queries/neo4j_client');
const PythonMLBridge = require('./PythonMLBridge');

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
                datastore: {
                    status: 'UNKNOWN',
                    type: 'Zoho Catalyst DataStore'
                },
                neo4j: {
                    status: neo4jClient.isConfigured() ? 'CONFIGURED' : 'UNCONFIGURED',
                    mode: neo4jClient.isConfigured() ? 'Remote AuraDB Graph' : 'Datastore Relational Graph Fallback'
                },
                pythonML: {
                    status: 'UNKNOWN',
                    engine: 'Scikit-Learn Microservice'
                },
                llm: {
                    status: process.env.GLM_API_KEY || process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'DETERMINISTIC_FALLBACK',
                    activeModel: 'GLM-4.7B / Zia Structured AI'
                },
                translation: {
                    status: process.env.CATALYST_TOKEN ? 'CONFIGURED' : 'IDENTITY_FALLBACK',
                    engine: 'Zoho Catalyst QuickML / Zia NLP'
                }
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

        // Determine overall status
        if (health.services.datastore.status !== 'ONLINE') {
            health.status = 'DEGRADED';
        }

        health.responseTimeMs = Date.now() - startTime;
        return health;
    }
}

module.exports = HealthService;
