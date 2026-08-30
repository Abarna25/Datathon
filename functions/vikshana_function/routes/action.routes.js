const express = require('express');
const ActionController = require('../controllers/ActionController');

const router = express.Router({ mergeParams: true });

router.get('/', ActionController.getActions);
router.post('/:actionId/status', ActionController.updateActionStatus);

module.exports = router;
