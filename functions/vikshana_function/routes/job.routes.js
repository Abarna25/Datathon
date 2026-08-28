const express = require('express');
const router = express.Router();
const SchedulerService = require('../services/SchedulerService');

// GET /jobs/threat-sync - Catalyst Job Scheduler endpoint for Threat Index recalculation
router.get('/threat-sync', async (req, res) => {
    try {
        const result = await SchedulerService.syncSectorThreatIndex(req);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Error in GET /jobs/threat-sync:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /jobs/daily-briefing - Catalyst Job Scheduler endpoint for Daily Officer Briefing docket
router.get('/daily-briefing', async (req, res) => {
    try {
        const result = await SchedulerService.generateDailyBriefing(req);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Error in GET /jobs/daily-briefing:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
