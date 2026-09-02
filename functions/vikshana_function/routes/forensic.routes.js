/**
 * forensic.routes.js
 * Protected API routes for Forensic Data Domains.
 */

const express = require('express');
const router = express.Router();
const ForensicController = require('../controllers/ForensicController');

// 1. Evidence
router.post('/evidence', ForensicController.createEvidence);
router.get('/evidence/case/:caseId', ForensicController.getEvidenceByCase);
router.put('/evidence/:evidenceId/custody', ForensicController.updateChainOfCustody);

// 2. CCTV
router.post('/cctv', ForensicController.createCCTV);
router.get('/cctv/case/:caseId', ForensicController.getCCTVByCase);

// 3. Call Detail Records (CDR)
router.post('/cdr', ForensicController.createCDR);
router.get('/cdr/case/:caseId', ForensicController.getCDRByCase);

// 4. Financial Transactions
router.post('/financial', ForensicController.createTransaction);
router.get('/financial/case/:caseId', ForensicController.getTransactionsByCase);
router.get('/financial/overview', ForensicController.getFinancialOverview);
router.get('/financial/money-trail', ForensicController.getMoneyTrails);
router.get('/financial/suspicious-patterns', ForensicController.getSuspiciousPatterns);

// 5. Forensic Reports
router.post('/reports', ForensicController.createReport);
router.get('/reports/case/:caseId', ForensicController.getReportsByCase);

// 6. Weapons
router.post('/weapons', ForensicController.createWeapon);
router.get('/weapons/case/:caseId', ForensicController.getWeaponsByCase);

// 7. Vehicles
router.post('/vehicles', ForensicController.createVehicle);
router.get('/vehicles/case/:caseId', ForensicController.getVehiclesByCase);

// 8. Biometrics
router.post('/biometrics', ForensicController.createBiometric);
router.get('/biometrics/case/:caseId', ForensicController.getBiometricsByCase);

// 9. Court Hearings
router.post('/court', ForensicController.createCourtHearing);
router.get('/court/case/:caseId', ForensicController.getCourtHearingsByCase);

// 10. Interrogation
router.post('/interrogation', ForensicController.createInterrogation);
router.post('/interrogations', ForensicController.createInterrogation);
router.get('/interrogation/case/:caseId', ForensicController.getInterrogationsByCase);
router.get('/interrogations/case/:caseId', ForensicController.getInterrogationsByCase);

// 11. Vector RAG Search
router.post('/rag/query', ForensicController.queryRAG);
router.post('/rag', ForensicController.queryRAG);

module.exports = router;
