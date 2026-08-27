class ContradictionDetectionService {
    /**
     * Deterministically detects contradictions in a case context by cross-referencing available datastore records.
     * @param {Object} context The case context built by ContextBuilderService
     * @returns {Object} Structured contradictions response
     */
    static detect(context) {
        const contradictions = [];
        if (!context || !context.case) {
            return { contradiction_detected: false, contradictions: [] };
        }

        const timeline = context.timeline || [];
        const occurrences = timeline.filter(t => t.source_type === 'occurrence_record');
        const arrests = timeline.filter(t => t.source_type === 'arrest_record');
        const suspects = context.suspects || [];
        const chargesheets = context.chargesheet || [];
        const witnesses = context.witnesses || [];
        const victims = context.victims || [];

        // 1. Timeline Contradiction: Arrest before crime occurrence
        for (const occurrence of occurrences) {
            for (const arrest of arrests) {
                if (occurrence.event_time && arrest.event_time) {
                    const occTime = new Date(occurrence.event_time).getTime();
                    const arrTime = new Date(arrest.event_time).getTime();
                    
                    if (arrTime < occTime) {
                        contradictions.push({
                            type: "Timeline Conflict",
                            field: "event_time",
                            source_a: `Arrest Record #${arrest.ROWID}`,
                            value_a: arrest.event_time,
                            source_b: `Occurrence Record #${occurrence.ROWID}`,
                            value_b: occurrence.event_time,
                            severity: "HIGH",
                            explanation: "Arrest date precedes the recorded date of crime occurrence."
                        });
                    }
                }
            }
        }

        // 2. Entity Attribute Contradiction: Duplicate suspect names with conflicting ages (if age difference > 5 years)
        const suspectMap = new Map();
        for (const suspect of suspects) {
            const nameKey = suspect.name.toLowerCase();
            if (nameKey === 'unknown accused' || nameKey === 'unknown') continue;
            
            if (suspectMap.has(nameKey)) {
                const existing = suspectMap.get(nameKey);
                // If they have the same name but significantly different ages, flag it as a contradiction
                if (suspect.age && existing.age && Math.abs(suspect.age - existing.age) > 5) {
                    contradictions.push({
                        type: "Entity Attribute Conflict",
                        field: "age",
                        source_a: `Accused Record #${existing.ROWID}`,
                        value_a: existing.age.toString(),
                        source_b: `Accused Record #${suspect.ROWID}`,
                        value_b: suspect.age.toString(),
                        severity: "MEDIUM",
                        explanation: `Multiple suspect records for "${suspect.name}" have significantly conflicting ages.`
                    });
                }
            } else {
                suspectMap.set(nameKey, suspect);
            }
        }

        // 3. Procedural Contradiction: Arrests exist but no Accused records
        const suspectIds = new Set(suspects.map(s => String(s.ROWID)));
        for (const arrest of arrests) {
            if (arrest.accused_id && !suspectIds.has(String(arrest.accused_id))) {
                contradictions.push({
                    type: "Procedural Conflict",
                    field: "accused_id",
                    source_a: `Arrest Record #${arrest.ROWID}`,
                    value_a: `Accused ID ${arrest.accused_id}`,
                    source_b: `Case Suspects List`,
                    value_b: "Missing",
                    severity: "CRITICAL",
                    explanation: `An arrest record exists for an Accused ID (${arrest.accused_id}) that is not officially linked as a suspect in this case.`
                });
            }
        }

        // 4. Procedural Contradiction: Chargesheet filed but no Occurrence dates recorded
        if (chargesheets.length > 0 && occurrences.length === 0) {
            contradictions.push({
                type: "Procedural Conflict",
                field: "occurrence_date",
                source_a: `Chargesheet Record #${chargesheets[0].ROWID}`,
                value_a: chargesheets[0].csdate || "Filed",
                source_b: `Occurrence Records`,
                value_b: "None",
                severity: "MEDIUM",
                explanation: "A chargesheet has been filed, but there are no recorded crime occurrence dates in the system."
            });
        }

        // 5. Entity Conflict: Suspect is also listed as a Victim in the same case
        const victimMap = new Map();
        for (const victim of victims) {
            const nameKey = victim.name.toLowerCase();
            if (nameKey !== 'unknown victim' && nameKey !== 'unknown') {
                victimMap.set(nameKey, victim);
            }
        }
        for (const suspect of suspects) {
            const nameKey = suspect.name.toLowerCase();
            if (nameKey !== 'unknown accused' && nameKey !== 'unknown' && victimMap.has(nameKey)) {
                const victim = victimMap.get(nameKey);
                contradictions.push({
                    type: "Entity Role Conflict",
                    field: "role",
                    source_a: `Accused Record #${suspect.ROWID}`,
                    value_a: "Suspect",
                    source_b: `Victim Record #${victim.ROWID}`,
                    value_b: "Victim",
                    severity: "CRITICAL",
                    explanation: `Entity "${suspect.name}" is listed as both a Suspect and a Victim in the same case.`
                });
            }
        }

        return {
            contradiction_detected: contradictions.length > 0,
            contradictions: contradictions
        };
    }
}

module.exports = ContradictionDetectionService;
