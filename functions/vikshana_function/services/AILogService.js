class AILogService {
    /**
     * Gracefully print the AI interaction log to console since AIInteractionLog table is nonexistent.
     */
    static async logInteraction(req, user, caseId, prompt, model, confidence, evidenceIds) {
        if (!user) user = { id: 'SYSTEM', name: 'SYSTEM', role: 'System' };
        const user_name = user.name || 'UNKNOWN';
        const role = user.role || 'UNKNOWN';
        
        console.warn(`[AI INTERACTION LOG] User: ${user_name} (${role}) | CaseMasterID: ${caseId} | Model: ${model} | Prompt: ${String(prompt).slice(0, 100)}...`);
    }
}

module.exports = AILogService;
