const express = require('express');
const RelationshipController = require('../controllers/RelationshipController');
const CommunityDetectionController = require('../controllers/CommunityDetectionController');

const router = express.Router();

router.get('/', RelationshipController.getNetwork);
router.get('/communities', CommunityDetectionController.detectCommunities);

module.exports = router;
