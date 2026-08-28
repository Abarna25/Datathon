const express = require('express');
const router = express.Router();
const ConvoKraftService = require('../services/ConvoKraftService');

// POST /convokraft/synthesize-dictation - Process dictation / interrogation audio transcript
router.post('/synthesize-dictation', async (req, res) => {
    try {
        const result = await ConvoKraftService.synthesizeDictation(req, req.body || {});
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Error in POST /convokraft/synthesize-dictation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /convokraft/voice-command - Parse field officer voice command
router.post('/voice-command', async (req, res) => {
    try {
        const result = await ConvoKraftService.parseVoiceCommand(req, req.body || {});
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Error in POST /convokraft/voice-command:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
