const express = require('express');
const catalyst = require('zcatalyst-sdk-node');

const app = express();
app.use(catalyst.initialize);

app.get('/', async (req, res) => {
    try {
        const app = catalyst.initialize(req);
        const zcql = app.zcql();
        try {
            const queryRes = await zcql.executeZCQLQuery("SHOW TABLES");
            res.json({ success: true, data: queryRes });
        } catch(err) {
            res.json({ success: false, error: err.message, stack: err.stack });
        }
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

module.exports = app;
