const app = require('./index');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log('\n======================================================');
    console.log('?? Vikshana Backend running locally on port ' + PORT);
    console.log('⚡  Bypassing Catalyst CLI (Using local fallback datastore)');
    console.log('======================================================\n');
});
