const express = require('express');
const router = express.Router();
const SignalService = require('../services/SignalService');

// POST /signals/publish - Publish a signal event
router.post('/publish', async (req, res) => {
    try {
        const { eventType, payload } = req.body;
        if (!eventType) {
            return res.status(400).json({ success: false, error: 'eventType is required' });
        }
        const result = await SignalService.publish(req, eventType, payload);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Error in POST /signals/publish:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /signals/listener - Signal listener webhook endpoint
router.post('/listener', async (req, res) => {
    try {
        const eventSignal = req.body;
        console.log('[Signal Listener] Received Event:', eventSignal);
        res.status(200).json({ success: true, acknowledged: true });
    } catch (error) {
        console.error('Error in POST /signals/listener:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
