/**
 * foresight.routes.js
 * Express routes for VIKSHANA 3.0 Foresight Predictive Intelligence
 */

const express = require('express');
const router = express.Router();
const ForesightController = require('../controllers/ForesightController');
const { authorizeRole } = require('../middleware/authMiddleware');

// Public/Officer accessible endpoints (Decision-support only)
router.get('/model-card', ForesightController.getModelCard);
router.post('/assess', ForesightController.assessAccused);
router.get('/assess', ForesightController.assessAccused);
router.get('/cases/:caseId/assessments', ForesightController.assessCaseSuspects);
router.post('/decision', ForesightController.recordDecision);
router.get('/audit-trail', ForesightController.getAuditTrail);

module.exports = router;
