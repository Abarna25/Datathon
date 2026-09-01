require('dotenv').config();
const PlannerAgent = require('./agents/PlannerAgent');

async function testPlanner() {
    const plan = await PlannerAgent.planInvestigation("Find burglaries connected by vehicle KA01AB1234");
    console.log(JSON.stringify(plan, null, 2));
}

testPlanner();
