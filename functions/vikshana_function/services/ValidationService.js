class ValidationService {
    /**
     * Validates an LLM JSON response to ensure its evidence citations actually exist in the provided context.
     * @param {Object} rawJson The parsed JSON response from the LLM
     * @param {Array} unifiedEvidence The evidence array fetched from datastore
     * @param {String} caseId The active case ID
     */
    static validate(rawJson, unifiedEvidence, caseId) {
        if (!rawJson) return rawJson;
        
        // Ensure evidence_used exists
        if (rawJson.evidence_used && Array.isArray(rawJson.evidence_used)) {
            const validIds = new Set();
            if (caseId) validIds.add(String(caseId));
            
            // Extract IDs from unified evidence
            if (unifiedEvidence && Array.isArray(unifiedEvidence)) {
                unifiedEvidence.forEach(e => {
                    if (e.ROWID) validIds.add(String(e.ROWID));
                    // Also support checking the specific fields that might be used as IDs
                    if (e.EvidenceID) validIds.add(String(e.EvidenceID));
                });
            }

            const validatedEvidence = [];
            const invalidCitations = [];

            rawJson.evidence_used.forEach(citation => {
                let isValid = false;
                
                // Allow specific prompt-defined special cases
                if (typeof citation === 'string' && citation.includes("CaseMaster Fact Analysis")) {
                    isValid = true; 
                } else {
                    // Check if the citation string contains any valid ROWID
                    for (let id of validIds) {
                        if (String(citation).includes(id)) {
                            isValid = true;
                            break;
                        }
                    }
                }

                if (isValid) {
                    validatedEvidence.push(citation);
                } else {
                    invalidCitations.push(citation);
                }
            });

            // Update JSON
            rawJson.evidence_used = validatedEvidence;
            
            // If invalid citations were stripped, append a warning to the answer
            if (invalidCitations.length > 0) {
                const warning = `\n\n> **[Hallucination Guard Triggered]** Insufficient evidence in available records. The AI attempted to cite unverified evidence records (${invalidCitations.join(', ')}).`;
                if (rawJson.answer) {
                    rawJson.answer += warning;
                } else {
                    rawJson.answer = warning.trim();
                }
            }
        }
        
        return rawJson;
    }
}

module.exports = ValidationService;
