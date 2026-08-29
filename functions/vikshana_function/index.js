const express = require('express');
require('dotenv').config({ path: __dirname + '/.env' });
const cors = require('cors');
const datastoreClient = require('./queries/datastoreClient');
const { authenticateToken, authorizeRole } = require('./middleware/authorize.middleware');
const { fieldFilter } = require('./middleware/fieldFilter.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const investigateRoutes = require('./routes/investigation.routes');
const relationshipRoutes = require('./routes/relationship.routes');
const evidenceRoutes = require('./routes/evidence.routes');
const reportRoutes = require('./routes/report.routes');
const devRoutes = require('./routes/dev.routes');
const conversationRoutes = require('./routes/conversation.routes');
const caseRoutes = require('./routes/case.routes');
const signalRoutes = require('./routes/signal.routes');
const jobRoutes = require('./routes/job.routes');
const mlRoutes = require('./routes/ml.routes');
const convokraftRoutes = require('./routes/convokraft.routes');
const offenderRoutes = require('./routes/offender.routes');
const decisionRoutes = require('./routes/decision.routes');
const auditRoutes = require('./routes/audit.routes');
const textToSqlRoutes = require('./routes/textToSql.routes');
const firIntelligenceRoutes = require('./routes/firIntelligence.routes');
const evidenceIntelligenceRoutes = require('./routes/evidenceIntelligence.routes');
const forecastingRoutes = require('./routes/forecasting.routes');
const forensicRoutes = require('./routes/forensic.routes');

const app = express();

const requiredTables = [
    'CaseMaster', 'Victim', 'Accused', 'ComplainantDetails', 'ArrestSurrender',
    'ChargesheetDetails', 'ActSectionAssociation', 'Court', 'Unit'
];
let startupChecked = false;
let startupDiagnostic = null;

// Catalyst URL path prefix normalizer
app.use((req, res, next) => {
    const prefix = '/server/vikshana_function';
    if (req.url && req.url.startsWith(prefix)) {
        req.url = req.url.slice(prefix.length);
    }
    // Clean up empty url to root slash
    if (!req.url || req.url === '') {
        req.url = '/';
    }
    next();
});

// Request timing middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[API] ${req.method} ${req.originalUrl || req.url} duration=${duration}ms`);
    });
    next();
});

// Startup Validation Middleware
app.use(async (req, res, next) => {
    if (!startupChecked && process.env.NODE_ENV !== 'test') {
        startupChecked = true;

        console.log('[Startup Validation] Verifying 10 core tables in Catalyst Data Store...');
        const missing = [];
        for (const table of requiredTables) {
            try {
                await datastoreClient.getRows(req, table, { maxRows: 1 });
            } catch (err) {
                missing.push(`${table} (${err.message})`);
            }
        }
        if (missing.length > 0) {
            startupDiagnostic = `[STARTUP DIAGNOSTIC] Core tables missing in Catalyst:\n` + missing.map(m => `- ${m}`).join('\n');
            console.error(startupDiagnostic);
            app.set('startupDiagnostic', startupDiagnostic);
        } else {
            console.log('[Startup Validation] All 10 core tables verified successfully! 🚀');
        }
    }
    next();
});

// Global Middleware
app.use(cors());
app.use(express.json());

// Public Routes (Accessible without JWT)
app.use('/auth', authRoutes);
const HealthService = require('./services/HealthService');
app.get('/health', async (req, res) => {
    try {
        const health = await HealthService.getSystemHealth(req);
        const statusCode = health.status === 'UP' ? 200 : 200; // 200 with DEGRADED payload for observability
        res.status(statusCode).json({ success: true, ...health });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message, status: 'DOWN' });
    }
});

// Authenticate all subsequent routes with HMAC-SHA256 JWT validation
app.use(authenticateToken);
app.use(fieldFilter);

// Development & Diagnostic routes (Administrator ONLY, disabled in production)
if (process.env.NODE_ENV !== 'production') {
    app.use('/dev', authorizeRole('Administrator'), devRoutes);
    app.use('/test_zcql', authorizeRole('Administrator'), require('./test_zcql'));
}

// Audit Routes (Restricted to Administrator and Supervisor)
app.use('/audit', authorizeRole('Administrator', 'Supervisor'), auditRoutes);

// Role Protected API Routes
app.use('/dashboard', authorizeRole('Administrator', 'Investigator', 'Analyst', 'Supervisor', 'Policymaker', 'Officer'), dashboardRoutes);
app.use('/investigate', authorizeRole('Administrator', 'Investigator', 'Supervisor', 'Analyst', 'Policymaker', 'Officer'), investigateRoutes);
app.use('/conversations', authorizeRole('Administrator', 'Investigator', 'Supervisor', 'Analyst', 'Policymaker', 'Officer'), conversationRoutes);
app.use('/cases', authorizeRole('Administrator', 'Investigator', 'Supervisor', 'Analyst', 'Policymaker', 'Officer'), caseRoutes);
app.use('/decision', authorizeRole('Administrator', 'Investigator', 'Supervisor', 'Officer'), decisionRoutes);
app.use('/offender', authorizeRole('Administrator', 'Investigator', 'Supervisor', 'Officer'), offenderRoutes);
app.use('/evidence', authorizeRole('Administrator', 'Investigator', 'Supervisor', 'Officer'), evidenceRoutes);
app.use('/forensics', authorizeRole('Administrator', 'Investigator', 'Supervisor', 'Officer'), forensicRoutes);

app.use('/relationships', authorizeRole('Administrator', 'Investigator', 'Analyst', 'Supervisor', 'Officer'), relationshipRoutes);
app.use('/forecasting', authorizeRole('Administrator', 'Investigator', 'Analyst', 'Supervisor', 'Policymaker', 'Officer'), forecastingRoutes);
app.use('/ml', authorizeRole('Administrator', 'Investigator', 'Analyst', 'Supervisor', 'Officer'), mlRoutes);

app.use('/reports', authorizeRole('Administrator', 'Investigator', 'Analyst', 'Supervisor', 'Policymaker', 'Officer'), reportRoutes);
app.use('/signals', authorizeRole('Administrator', 'Investigator', 'Analyst', 'Supervisor', 'Policymaker', 'Officer'), signalRoutes);
app.use('/jobs', authorizeRole('Administrator', 'Investigator', 'Supervisor', 'Officer'), jobRoutes);
app.use('/convokraft', authorizeRole('Administrator', 'Investigator', 'Supervisor', 'Officer'), convokraftRoutes);
const advancedIntelligenceRoutes = require('./routes/advancedIntelligence.routes');
const sociologicalRoutes = require('./routes/sociological.routes');
const intelligenceRoutes = require('./routes/intelligence.routes');

app.use('/text-to-sql', authorizeRole('Administrator', 'Investigator', 'Supervisor', 'Analyst', 'Policymaker', 'Officer'), textToSqlRoutes);
app.use('/fir-intelligence', authorizeRole('Administrator', 'Investigator', 'Supervisor', 'Analyst', 'Policymaker', 'Officer'), firIntelligenceRoutes);
app.use('/evidence-intelligence', authorizeRole('Administrator', 'Investigator', 'Supervisor', 'Analyst', 'Policymaker', 'Officer'), evidenceIntelligenceRoutes);
app.use('/advanced-intelligence', authorizeRole('Administrator', 'Investigator', 'Supervisor', 'Officer'), advancedIntelligenceRoutes);
app.use('/sociological', authorizeRole('Administrator', 'Investigator', 'Supervisor', 'Analyst', 'Policymaker', 'Officer'), sociologicalRoutes);
app.use('/intelligence', authorizeRole('Administrator', 'Investigator', 'Supervisor', 'Analyst', 'Policymaker', 'Officer'), intelligenceRoutes);

// Fallback for missing routes
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found in VIKSHANA API', data: [] });
});

// Global Error Handler returning proper HTTP status codes
app.use((err, req, res, next) => {
    console.error('Unhandled Global Error:', err);
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({ 
        success: false, 
        message: 'Internal server error occurred.',
        error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message,
        data: [] 
    });
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`[VIKSHANA API] Backend server running locally on http://localhost:${PORT}`);
    });
}

module.exports = app;


