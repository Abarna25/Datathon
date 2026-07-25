const neo4j = require('neo4j-driver');

let driver;

/**
 * Initialize Neo4j Driver
 */
function initNeo4j() {
    if (!driver) {
        const uri = process.env.NEO4J_URI || 'neo4j+s://demo.neo4j.com'; // Default placeholder
        const user = process.env.NEO4J_USER || 'neo4j';
        const password = process.env.NEO4J_PASSWORD || 'password';

        try {
            driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
            console.log('Neo4j Driver initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Neo4j Driver', error);
        }
    }
    return driver;
}

/**
 * Execute a Cypher query
 * @param {string} cypher - The cypher query string
 * @param {object} params - Parameters for the query
 * @returns {Promise<Array>} Array of records
 */
async function executeQuery(cypher, params = {}) {
    const neoDriver = initNeo4j();
    if (!neoDriver) throw new Error("Neo4j driver not initialized");

    const session = neoDriver.session();
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
        console.error('Error executing cypher query', error);
        throw error;
    } finally {
        await session.close();
    }
}

/**
 * Close driver connection
 */
async function closeNeo4j() {
    if (driver) {
        await driver.close();
        driver = null;
    }
}

module.exports = {
    initNeo4j,
    executeQuery,
    closeNeo4j
};
