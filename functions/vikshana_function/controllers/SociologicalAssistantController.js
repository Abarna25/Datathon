const glmClient = require('../services/glmClient');
const SuggestionService = require('../services/SuggestionService');
const AILogService = require('../services/AILogService');

const GLM_AVAILABLE = !!(process.env.GLM_ENDPOINT && process.env.GLM_MODEL);

const SOCIOLOGICAL_SYSTEM_PROMPT = `You are VIKSHANA's Sociological Intelligence Assistant — an expert in criminology, socio-economic analysis, and evidence-based policy. You analyse social risk factors such as unemployment, education disparity, poverty, housing insecurity, and recidivism, and their correlation with crime patterns.

When answering questions, you MUST return ONLY a valid JSON object matching this exact schema (no prose, no code fences):

{
  "answer": "Main analysis text. Be specific, data-driven, and cite indicator values inline.",
  "confidence": "HIGH|MEDIUM|LOW",
  "confidenceReason": "One sentence explaining the confidence level based on data coverage.",
  "reasoningSummary": [
    "Step-by-step reasoning chain as an array of short strings (3–5 steps).",
    "Each string is one logical inference made during analysis."
  ],
  "evidence": [
    { "label": "Indicator name", "value": "Metric value", "implication": "What this metric implies for crime risk." }
  ],
  "supportingRecords": [
    { "id": "REC-001", "type": "Statistical Report|Field Survey|Historical Data|Policy Document", "title": "Short descriptive title", "year": "2024–2026" }
  ],
  "evidenceReferences": [
    { "refId": "REF-001", "source": "Data source name", "credibility": "HIGH|MEDIUM|LOW", "note": "Brief note on why this source is relevant." }
  ],
  "dataSources": ["Source name 1", "Source name 2"],
  "relatedDistricts": ["District A", "District B"],
  "policyImplication": "One concrete, actionable policy recommendation."
}

Rules:
- reasoningSummary must have 3–5 items explaining HOW the answer was reached.
- supportingRecords must have 2–4 items referencing real-world data types.
- evidenceReferences must have 2–3 items.
- dataSources must list 2–4 named data sources (e.g., "National Crime Records Bureau 2025", "Census Socio-Economic Survey 2024").
- All values must be realistic and relevant. Never fabricate metric values.`;

class SociologicalAssistantController {
    static async ask(req, res) {
        const { question, history = [], language = 'en' } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({ success: false, error: 'question is required' });
        }

        if (!GLM_AVAILABLE) {
            return res.status(200).json({
                success: false,
                error: 'AI Service unavailable'
            });
        }

        try {
            let structuredData;
            const glmMessages = [
                { role: 'system', content: SOCIOLOGICAL_SYSTEM_PROMPT },
                ...history.slice(-6).map(h => ({
                    role: h.role === 'user' ? 'user' : 'assistant',
                    content: h.role === 'user'
                        ? h.content
                        : JSON.stringify(h.structuredData || { answer: h.content })
                })),
                { role: 'user', content: question }
            ];

            const result = await glmClient.generate(glmMessages, { maxTokens: 1536, temperature: 0.35 });
            let rawContent = (result.content || '').trim();

            rawContent = rawContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                structuredData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('AI response is not in structured JSON format.');
            }

            // Normalise arrays to prevent frontend crashes
            structuredData.evidence          = Array.isArray(structuredData.evidence)          ? structuredData.evidence          : [];
            structuredData.supportingRecords  = Array.isArray(structuredData.supportingRecords)  ? structuredData.supportingRecords  : [];
            structuredData.evidenceReferences = Array.isArray(structuredData.evidenceReferences) ? structuredData.evidenceReferences : [];
            structuredData.dataSources        = Array.isArray(structuredData.dataSources)        ? structuredData.dataSources        : [];
            structuredData.relatedDistricts   = Array.isArray(structuredData.relatedDistricts)   ? structuredData.relatedDistricts   : [];
            structuredData.reasoningSummary   = Array.isArray(structuredData.reasoningSummary)   ? structuredData.reasoningSummary   : [];

            structuredData.generatedAt = new Date().toISOString();
            structuredData.modelId = structuredData.modelId || 'crm-di-glm47b';

            // Generate follow-up suggestions
            const suggestions = await SuggestionService.generateFollowUps(
                structuredData.answer,
                'Sociological intelligence analysis covering unemployment, education, recidivism, and district-level crime correlations.'
            ).catch(() => [
                'Which district has the highest social risk score?',
                'How does education disparity affect crime rates?',
                'What policy interventions are most effective?',
            ]);

            const evIds = structuredData.evidenceReferences?.map(e => e.refId) || [];
            AILogService.logInteraction(req, req.user, 'SOCIOLOGICAL_QUERY', question, structuredData.modelId, structuredData.confidence, evIds);

            res.status(200).json({
                success: true,
                data: { question, structuredData, suggestions }
            });
        } catch (error) {
            console.error('[SociologicalAssistantController] Error:', error);
            res.status(200).json({
                success: false,
                error: 'AI Service unavailable'
            });
        }
    }
}

module.exports = SociologicalAssistantController;
