const glmClient = require('./glmClient');
const AuditService = require('./AuditService');

class FIRIntelligenceService {
    
    async analyzeFIR(req, firText, caseId = 'UNASSIGNED') {
        const systemPrompt = `You are a Principal Criminal Intelligence AI.
Your task is to analyze an FIR (First Information Report) and extract structured data.
You must return the response as a STRICT JSON OBJECT, matching this format exactly:

{
  "summary": {
    "summary_text": "...",
    "crime_type": "...",
    "ipc_sections": "...",
    "location": "...",
    "date": "...",
    "time": "..."
  },
  "entities": [
    {
      "entity_type": "Person|Vehicle|Weapon|Location|Phone Number|Email|Bank Account|Organization|Court|Police Station|Case Number|Evidence ID|Passport|Aadhaar|License Plate",
      "entity_value": "...",
      "extracted_from": "Exact sentence or snippet",
      "confidence": 0.95,
      "reasoning": "Why it was extracted"
    }
  ],
  "aliases": [
    {
      "primary_name": "Vikram",
      "alias_name": "Vicky",
      "reason": "..."
    }
  ],
  "relationships": [
    {
      "source_entity": "Vikram",
      "target_entity": "Weapon XYZ",
      "relationship_type": "possessed",
      "confidence": 0.9
    }
  ],
  "timeline": [
    {
      "event_time": "ISO date or time",
      "title": "...",
      "description": "...",
      "source_type": "FIR"
    }
  ],
  "investigation_leads": [
    {
      "lead_type": "Most suspicious entity|Unknown entity|Missing witness|Missing evidence|Conflicting statement|Potential accomplice",
      "reasoning": "...",
      "evidence": "...",
      "priority": "High|Medium|Low",
      "confidence": 0.8
    }
  ]
}

DO NOT wrap the output in markdown blocks. Return raw JSON.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: firText }
        ];

        try {
            const response = await glmClient.generate(messages, { temperature: 0.1, maxTokens: 8000 });
            let rawJson = response.content.trim().replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
            const parsedData = JSON.parse(rawJson);

            // Log Audit
            await AuditService.logEvent(req, req.user, 'Analyzed FIR Narrative', 'FIRIntelligence', caseId, 'SUCCESS');

            return parsedData;

        } catch (error) {
            console.error('[FIRIntelligenceService] Failed:', error.message);
            await AuditService.logEvent(req, req.user, 'Failed FIR Analysis', 'FIRIntelligence', caseId, 'FAILED');
            throw error;
        }
    }
}

module.exports = new FIRIntelligenceService();
