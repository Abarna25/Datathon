const ds = require('../queries/datastoreClient');

async function run() {
    console.log('Testing SQL Query Engine...');

    // 1. Basic 2021 cases
    const q1 = await ds.query({}, "SELECT * FROM CaseMaster WHERE CrimeRegisteredDate LIKE '2021%' LIMIT 5");
    console.log('Q1 (2021 Cases):', q1.length, 'First Case:', q1[0]?.CaseMaster?.CrimeNo);

    // 2. Accused search
    const q2 = await ds.query({}, "SELECT * FROM Accused WHERE AccusedName LIKE '%Ramesh%' LIMIT 5");
    console.log('Q2 (Ramesh):', q2.length, 'Accused:', q2[0]?.Accused?.AccusedName);

    // 3. Multi-filter Accused (Male aged 20-30)
    const q3 = await ds.query({}, "SELECT * FROM Accused WHERE AgeYear >= 20 AND AgeYear <= 30 AND GenderID = 1 LIMIT 5");
    console.log('Q3 (Male 20-30):', q3.length, 'Sample:', q3[0]?.Accused);

    // 4. Count aggregation
    const q4 = await ds.query({}, "SELECT COUNT(*) FROM CaseMaster");
    console.log('Q4 (Total Cases):', q4);

    // 5. Units / Police Stations
    const q5 = await ds.query({}, "SELECT * FROM Unit LIMIT 5");
    console.log('Q5 (Units):', q5.length, 'Sample:', q5[0]?.Unit?.UnitName);

    // 6. Chargesheets
    const q7 = await ds.query({}, "SELECT * FROM ChargesheetDetails LIMIT 5");
    console.log('Q6 (Chargesheets):', q7.length, 'Sample:', q7[0]?.ChargesheetDetails);

    console.log('Datastore Engine Verification Completed Successfully!');
}

run().catch(console.error);
