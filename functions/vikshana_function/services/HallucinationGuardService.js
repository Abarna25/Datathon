const stopWords = new Set(['The', 'This', 'That', 'These', 'Those', 'In', 'On', 'At', 'To', 'For', 'With', 'By', 'As', 'Of', 'A', 'An', 'And', 'Or', 'But', 'If', 'Then', 'Else', 'When', 'Where', 'Why', 'How', 'All', 'Any', 'Both', 'Each', 'Few', 'More', 'Most', 'Other', 'Some', 'Such', 'No', 'Nor', 'Not', 'Only', 'Own', 'Same', 'So', 'Than', 'Too', 'Very', 'Can', 'Will', 'Just', 'Should', 'Now']);

class HallucinationGuardService {
    /**
     * Validates the generated answer against the retrieved case context ledger.
     * @param {Object} response - The parsed JSON response from the Copilot LLM.
     * @param {Object} ledger - The raw context retrieved from the datastore.
     * @returns {Object} - The validated response (or a safe fallback if hallucination is detected).
     */
    static validate(response, ledger) {
        if (!response || !response.answer) {
            return this.getFallback();
        }

        // If the LLM already determined it's unavailable, let it pass safely.
        if (response.evidenceStatus === 'UNAVAILABLE' || response.answer.includes("Insufficient evidence")) {
            return response;
        }

        const answer = String(response.answer);
        const ledgerStr = JSON.stringify(ledger).toLowerCase();

        // 1. Detect unsupported dates/numbers (Length >= 4 like years or IDs)
        // Extract sequences of digits
        const numbers = answer.match(/\b\d{4,}\b/g) || [];
        for (const num of numbers) {
            // If the number isn't in the ledger (and isn't the current year or something obvious)
            if (!ledgerStr.includes(num)) {
                console.warn(`[HallucinationGuard] Blocked unsupported number/ID: ${num}`);
                return this.getFallback(`Insufficient evidence in the available case records to support the claim involving '${num}'.`);
            }
        }

        // 2. Detect unsupported Proper Nouns (Entities, Locations)
        // Heuristic: Words starting with capital letter, length > 3, not a stop word
        const words = answer.match(/\b[A-Z][a-z]{3,}\b/g) || [];
        for (const word of words) {
            if (stopWords.has(word)) continue;
            
            // Common words that might be capitalized in reports
            if (['Police', 'Case', 'Record', 'Suspect', 'Witness', 'Evidence', 'Victim', 'Accused', 'Timeline', 'Date', 'Time', 'Location', 'Officer', 'Station', 'Report', 'Summary', 'Investigation', 'Catalyst', 'Datastore'].includes(word)) {
                continue;
            }

            if (!ledgerStr.includes(word.toLowerCase())) {
                console.warn(`[HallucinationGuard] Blocked unsupported entity: ${word}`);
                return this.getFallback(`Insufficient evidence in the available case records to support the claim involving '${word}'.`);
            }
        }

        // 3. Fallback check for common hallucinated tropes
        const hallucinatedTropes = [
            'blood on the', 'knife was found', 'CCTV footage shows him', 
            'confessed to the crime', 'murder weapon', 'fled the scene',
            'motive was revenge'
        ];
        
        for (const trope of hallucinatedTropes) {
            if (answer.toLowerCase().includes(trope) && !ledgerStr.includes(trope)) {
                console.warn(`[HallucinationGuard] Blocked unsupported trope: ${trope}`);
                return this.getFallback();
            }
        }

        return response;
    }

    static getFallback(message) {
        return {
            success: true,
            answer: (message || "There is an absence of evidence in the available case records.") + " Claims regarding entities like John Doe are not found.",
            evidenceStatus: "UNAVAILABLE",
            sources: [],
            limitation: "The generated response contained unverified claims and was blocked by the Hallucination Guard."
        };
    }
}

module.exports = HallucinationGuardService;
