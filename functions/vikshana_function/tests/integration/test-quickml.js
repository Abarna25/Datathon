const axios = require('axios');

async function testApi() {
    try {
        console.log('\nTesting application/json with zoho-inputstream nested');
        const res3 = await axios.post(
            'https://api.catalyst.zoho.in/quickml/api/v1/models/zia/translate',
            { 
                "zoho-inputstream": {
                    text: ["Hello"], 
                    source_language: "English", 
                    target_language: "Kannada" 
                }
            },
            {
                headers: {
                    'CATALYST-ORG': '60077000408',
                    'Authorization': 'Zoho-oauthtoken dummy_token',
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Res3:', res3.status);
    } catch (e) {
        console.log('Error 3:', e.response?.status, e.response?.data);
    }

    try {
        console.log('\nTesting application/json with zoho-inputstream stringified');
        const res4 = await axios.post(
            'https://api.catalyst.zoho.in/quickml/api/v1/models/zia/translate',
            { 
                "zoho-inputstream": JSON.stringify({
                    text: ["Hello"], 
                    source_language: "English", 
                    target_language: "Kannada" 
                })
            },
            {
                headers: {
                    'CATALYST-ORG': '60077000408',
                    'Authorization': 'Zoho-oauthtoken dummy_token',
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Res4:', res4.status);
    } catch (e) {
        console.log('Error 4:', e.response?.status, e.response?.data);
    }
}

testApi();
