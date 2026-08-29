/**
 * sentinel.routes.js
 * Protected Express routes for VIKSHANA Sentinel Autonomous Case Triage.
 */

const express = require('express');
const router = express.Router();
const SentinelController = require('../controllers/SentinelController');

// 1. Dashboard State & Summary
router.get('/dashboard', SentinelController.getDashboard);

// 2. Trigger On-Demand Multi-Case Scan
router.post('/scan', SentinelController.triggerScan);

// 3. Action Queue & Filter
router.get('/actions', SentinelController.getActions);

// 4. Single Case Granular Triage Scorecard
router.get('/cases/:caseId/triage', SentinelController.getCaseTriage);

// 5. Human Decision (Approve / Dismiss)
router.post('/actions/:actionId/decision', SentinelController.handleDecision);

// 6. Decision Audit Trail
router.get('/audit-trail', SentinelController.getDecisionAuditTrail);

module.exports = router;
