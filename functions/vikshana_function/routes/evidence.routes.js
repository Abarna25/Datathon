const express = require('express');
const EvidenceController = require('../controllers/EvidenceController');

const EvidenceImpactController = require('../controllers/EvidenceImpactController');

const router = express.Router({ mergeParams: true });

router.get('/', EvidenceController.getEvidence);
router.post('/', EvidenceImpactController.addEvidence);
router.get('/impact', EvidenceImpactController.getImpactHistory);

module.exports = router;
