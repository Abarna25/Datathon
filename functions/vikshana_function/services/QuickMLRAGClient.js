const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

class QuickMLRAGClient {
    constructor() {
        this.endpoint = process.env.QUICKML_RAG_ENDPOINT || 'https://api.catalyst.zoho.in/quickml/v1/project/52119000000013050/rag/answer';
        this.org = process.env.CATALYST_ORG;
    }

    async getFreshAccessToken() {
        let currentApiKey = process.env.GLM_API_KEY || process.env.CATALYST_TOKEN;
        try {
            const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf-8');
            const tokenMatch = envContent.match(/CATALYST_TOKEN=(.*)/);
            if (tokenMatch && tokenMatch[1]) {
                currentApiKey = tokenMatch[1].trim();
            }
        } catch (err) {
            // ignore
        }
        return currentApiKey;
    }

    async generate(messages, options = {}) {
        const token = await this.getFreshAccessToken();
        if (!token) throw new Error('[QuickMLRAGClient] Authentication token missing.');

        // Extract context and question
        let systemContext = "";
        let userQuestion = "";

        for (const msg of messages) {
            if (msg.role === 'system') {
                systemContext += msg.content + "\n";
            } else if (msg.role === 'user') {
                if (msg.content.startsWith('Evidence Ledger:')) {
                    // Extract ledger as context for RAG
                    systemContext += "\n" + msg.content;
                } else {
                    userQuestion += msg.content + "\n";
                }
            }
        }

        userQuestion = userQuestion.trim();
        if (!userQuestion) userQuestion = "Summarize the context.";

        try {
            const form = new FormData();
            form.append('zoho-inputstream', Buffer.from(systemContext || 'No context provided.', 'utf-8'), { filename: 'context.txt' });
            form.append('question', userQuestion);

            const response = await axios.post(this.endpoint, form, {
                headers: {
                    'CATALYST-ORG': this.org || '60077000408',
                    'Authorization': `Zoho-oauthtoken ${token}`,
                    ...form.getHeaders()
                },
                timeout: options.timeoutMs || 30000
            });

            const responseData = response.data;
            let rawContent = responseData.answer || responseData.response || responseData.content || JSON.stringify(responseData);

            return {
                content: rawContent,
                tool_calls: null,
                finish_reason: 'stop'
            };
        } catch (error) {
            // RAG endpoint might reject form-data or fail, fallback handled by LLMService
            throw new Error(`[QuickMLRAGClient] API call failed: ${error.message}`);
        }
    }
}

module.exports = new QuickMLRAGClient();
