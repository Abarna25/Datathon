const express = require('express');
const router = express.Router();
const AuditController = require('../controllers/AuditController');
const AITraceabilityController = require('../controllers/AITraceabilityController');
const { authorizeRole } = require('../middleware/authorize.middleware');

// Admin only route to get logs
router.get('/', authorizeRole(['Administrator']), AuditController.getLogs);
router.get('/logs', authorizeRole(['Administrator']), AuditController.getLogs);

// Get AI logs
router.get('/ai-logs', authorizeRole(['Administrator', 'Supervisor']), AITraceabilityController.getLogs);

// Any authenticated user can create a log for their actions (e.g. Exported PDF)
router.post('/', AuditController.createLog);

module.exports = router;
