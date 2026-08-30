
class AnomalyDetectionService {
    /**
     * Scans the case context for logical inconsistencies deterministically.
     * @param {Object} context The case context built by ContextBuilderService
     * @returns {Array<Object>} A list of detected structured evidence gaps
     */
    static detectAnomalies(context) {
        let gaps = [];
        if (!context) return gaps;

        const timeline = context.timeline || [];
        const occurrences = timeline.filter(t => t.source_type === 'occurrence_record');
        const arrests = timeline.filter(t => t.source_type === 'arrest_record');
        const suspects = context.suspects || [];
        const chargesheets = context.chargesheet || [];



        // 1. Conflicting Dates / Impossible Chronology
        for (const occurrence of occurrences) {
            for (const arrest of arrests) {
                if (occurrence.event_time && arrest.event_time) {
                    const occTime = new Date(occurrence.event_time).getTime();
                    const arrTime = new Date(arrest.event_time).getTime();
                    
                    if (arrTime < occTime) {
                        gaps.push({
                            label: "EVIDENCE_GAP",
                            what: "Timeline Conflict",
                            why: `Arrest recorded on ${arrest.event_time} occurs before the crime occurrence on ${occurrence.event_time}.`,
                            source: `Arrest #${arrest.ROWID}, Occurrence #${occurrence.ROWID}`,
                            confidence: 0.85,
                            priority: "HIGH"
                        });
                    }
                }
            }
        }

        // 2. Missing Critical Information (Location/Time)
        for (const occurrence of occurrences) {
            if (!occurrence.event_time) {
                gaps.push({
                    label: "MISSING_METADATA",
                    what: "Missing Event Time",
                    why: `Crime occurrence record is missing the event time.`,
                    source: `Occurrence #${occurrence.ROWID}`,
                    confidence: 0.85,
                    priority: "HIGH"
                });
            }
            if (!occurrence.description || occurrence.description.includes('N/A')) {
                gaps.push({
                    label: "MISSING_METADATA",
                    what: "Missing Location Coordinates",
                    why: `Crime occurrence record is missing exact location coordinates.`,
                    source: `Occurrence #${occurrence.ROWID}`,
                    confidence: 0.85,
                    priority: "MEDIUM"
                });
            }
        }

        // 3. Duplicate Records (Duplicate suspects in the same case)
        const suspectNames = new Set();
        for (const suspect of suspects) {
            const key = `${suspect.name}_${suspect.age}`;
            if (suspectNames.has(key) && suspect.name !== 'Unknown Accused') {
                gaps.push({
                    label: "DUPLICATE_RECORD",
                    what: "Duplicate Suspect Record",
                    why: `Multiple suspect records found with identical name (${suspect.name}) and age (${suspect.age}).`,
                    source: `Accused #${suspect.ROWID}`,
                    confidence: 0.85,
                    priority: "LOW"
                });
            }
            suspectNames.add(key);
        }

        // 4. Procedural Gaps
        if (chargesheets.length > 0 && arrests.length === 0 && suspects.length > 0) {
            gaps.push({
                label: "UNRESOLVED_LINK",
                what: "Missing Arrest Records",
                why: `A chargesheet is filed but no arrest or surrender records are found for suspects.`,
                source: `Chargesheet, Accused`,
                confidence: 0.85,
                priority: "MEDIUM"
            });
        }

        // 5. Data Inconsistency
        if (arrests.length > 0 && suspects.length === 0) {
            gaps.push({
                label: "UNRESOLVED_LINK",
                what: "Orphaned Arrest Record",
                why: `Arrest records exist, but no Accused records are associated with the case.`,
                source: `Arrest`,
                confidence: 0.85,
                priority: "CRITICAL"
            });
        }

        return gaps;
    }
}

module.exports = AnomalyDetectionService;
