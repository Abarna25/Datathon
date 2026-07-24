const express = require('express');
const CaseController = require('../controllers/CaseController');
const InvestigationDataController = require('../controllers/InvestigationDataController');

const router = express.Router();

router.get('/', CaseController.listCases);
router.get('/search', CaseController.searchEverything);
router.get('/:caseId/full-bundle', CaseController.getFullBundle);
router.get('/:caseId/summary', InvestigationDataController.getCaseSummary);
router.get('/:caseId/witnesses', InvestigationDataController.getWitnesses);
router.get('/:caseId/suspects', InvestigationDataController.getSuspects);
router.get('/:caseId/cctv', InvestigationDataController.getCctv);
router.get('/:caseId/phone-records', InvestigationDataController.getPhoneRecords);
router.get('/:caseId/financial-transactions', InvestigationDataController.getFinancialTransactions);
router.get('/:caseId/timeline', InvestigationDataController.getTimeline);
router.put('/:caseId', CaseController.updateCase);
router.delete('/:caseId/:recordId', CaseController.deleteRecord);

module.exports = router;
