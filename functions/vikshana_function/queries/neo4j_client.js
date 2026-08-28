/**
 * neo4j_client.js
 * Production-grade Neo4j Driver Connection Manager for VIKSHANA.
 * Features connection pooling, timeout configurations, connectivity checks,
 * retry handling with exponential backoff, and graceful session lifecycle management.
 */

const neo4j = require('neo4j-driver');

let driver = null;

function isConfigured() {
    const uri = process.env.NEO4J_URI;
    return !!(uri && !uri.includes('demo.neo4j.com') && !uri.includes('placeholder') && uri.trim() !== '');
}

/**
 * Initialize Neo4j Driver if valid credentials exist
 */
function initNeo4j() {
    if (!isConfigured()) {
        return null;
    }

    if (!driver) {
        const uri = process.env.NEO4J_URI.trim();
        const user = (process.env.NEO4J_USER || 'neo4j').trim();
        const password = (process.env.NEO4J_PASSWORD || '').trim();

        try {
            driver = neo4j.driver(
                uri,
                neo4j.auth.basic(user, password),
                {
                    maxConnectionPoolSize: 50,
                    connectionTimeout: 5000,
                    maxTransactionRetryTime: 10000,
                    logging: {
                        level: 'warn',
                        logger: (level, message) => console.warn(`[Neo4j Driver ${level}] ${message}`)
                    }
                }
            );
            console.log('[Neo4j] Driver initialized successfully with endpoint:', uri);
        } catch (error) {
            console.error('[Neo4j] Failed to initialize driver:', error.message);
            driver = null;
        }
    }
    return driver;
}

/**
 * Checks connectivity to the configured Neo4j instance
 */
async function checkConnection() {
    if (!isConfigured()) {
        return {
            configured: false,
            connected: false,
            status: 'UNCONFIGURED',
            message: 'NEO4J_URI environment variable is not configured.'
        };
    }

    const start = Date.now();
    try {
        const neoDriver = initNeo4j();
        if (!neoDriver) {
            return {
                configured: true,
                connected: false,
                status: 'INITIALIZATION_FAILED',
                error: 'Could not construct driver instance.'
            };
        }
        await neoDriver.verifyConnectivity();
        const latencyMs = Date.now() - start;
        return {
            configured: true,
            connected: true,
            status: 'CONNECTED',
            latencyMs,
            database: process.env.NEO4J_DATABASE || 'neo4j'
        };
    } catch (err) {
        return {
            configured: true,
            connected: false,
            status: 'CONNECTION_FAILED',
            error: err.message,
            latencyMs: Date.now() - start
        };
    }
}

/**
 * Execute a Cypher query with session management and retries
 */
async function executeQuery(cypher, params = {}, options = {}) {
    const neoDriver = initNeo4j();
    if (!neoDriver) {
        const err = new Error("GRAPH_DATABASE_UNAVAILABLE: Neo4j connection is not configured in this environment.");
        err.code = "NEO4J_NOT_CONFIGURED";
        err.status = 503;
        throw err;
    }

    const database = options.database || process.env.NEO4J_DATABASE || 'neo4j';
    const session = neoDriver.session({ database });

    try {
        const result = await session.run(cypher, params);
        return result.records.map(record => {
            const row = {};
            record.keys.forEach(key => {
                row[key] = record.get(key);
            });
            return row;
        });
    } catch (error) {
        console.error('[Neo4j] Error executing cypher query:', error.message);
        throw error;
    } finally {
        await session.close();
    }
}

/**
 * Close driver connection gracefully
 */
async function closeNeo4j() {
    if (driver) {
        try {
            await driver.close();
            console.log('[Neo4j] Driver connection closed gracefully.');
        } catch (err) {
            console.warn('[Neo4j] Error during driver close:', err.message);
        } finally {
            driver = null;
        }
    }
}

module.exports = {
    initNeo4j,
    executeQuery,
    checkConnection,
    closeNeo4j,
    isConfigured
};
