const catalyst = require('zcatalyst-sdk-node');

async function test() {
    console.log("Initializing Catalyst SDK...");
    try {
        const app = catalyst.initialize(); 
        console.log("App initialized.");
        
        console.log("Fetching CaseMaster rows...");
        const response = await app.datastore().table('CaseMaster').getPagedRows({ maxRows: 1 });
        console.log("SUCCESS! Got rows:", response.data.length);
        if (response.data.length > 0) {
            const firstRow = response.data[0];
            console.log("First Row (Filtered):", {
                ROWID: firstRow.ROWID,
                CaseMasterID: firstRow.CaseMasterID || firstRow.CaseMaster?.CaseMasterID
            });
        }
    } catch (e) {
        console.error("CATALYST SDK ERROR:", e);
        if (e.response) {
            console.error("Response Data:", e.response.data);
        }
    }
}

test();
