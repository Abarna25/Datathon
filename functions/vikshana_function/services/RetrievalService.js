const datastoreClient = require('../queries/datastoreClient');

const STOPWORDS = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or',
    'who', 'what', 'when', 'where', 'why', 'how', 'did', 'does', 'do', 'with', 'this', 'that', 'it',
    'be', 'been', 'has', 'have', 'had', 'show', 'me', 'please', 'list', 'all', 'any', 'about'
]);

function tokenize(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function scoreRow(row, tokens) {
    const haystack = JSON.stringify(row).toLowerCase();
    let score = 0;
    for (const t of tokens) {
        if (haystack.includes(t)) score += 1;
    }
    return score;
}

/** Ranks rows by keyword overlap; falls back to recency order (rows already come back newest-ish first) when the query has no usable tokens. */
function topK(rows, tokens, k = 5) {
    const list = rows || [];
    if (tokens.length === 0) return list.slice(0, k);
    return list
        .map((row) => ({ row, score: scoreRow(row, tokens) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, k)
        .map((entry) => entry.row);
}

class RetrievalService {
    static async retrieve(req, { caseId, query, context }) {
        const tokens = tokenize(query);

        const attachments = await datastoreClient.getRowsByCase(req, 'Attachment', caseId, { maxRows: 20 });
        const readyAttachments = attachments.filter((a) => a.status === 'ready');

        return {
            witnesses: topK(context.witnesses, tokens),
            suspects: topK(context.suspects, tokens),
            cctv: topK(context.cctv, tokens),
            phoneRecords: topK(context.phoneRecords, tokens),
            financialTransactions: topK(context.financialTransactions, tokens),
            timeline: topK(context.timeline, tokens, 8),
            chargesheet: context.chargesheet || [],
            sections: context.sections || [],
            attachments: topK(readyAttachments, tokens, 3)
        };
    }
}

module.exports = RetrievalService;
