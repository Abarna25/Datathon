const express = require('express');
const catalyst = require('zcatalyst-sdk-node');

const app = express();
app.use(catalyst.initialize);

app.get('/', async (req, res) => {
    try {
        const catalystApp = catalyst.initialize(req);
        const zcql = catalystApp.zcql();
        try {
            const queryRes = await zcql.executeZCQLQuery("SHOW TABLES");
            res.status(200).json({ success: true, data: queryRes });
        } catch(err) {
            console.error('[test_zcql] Query error:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    } catch (err) {
        console.error('[test_zcql] Init error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = app;
