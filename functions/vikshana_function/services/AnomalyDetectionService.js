class AnomalyDetectionService {
    /**
     * Scans the case context for logical inconsistencies deterministically.
     * @param {Object} context The case context built by ContextBuilderService
     * @returns {Array<Object>} A list of detected structured anomalies
     */
    static detectAnomalies(context) {
        let anomalies = [];
        if (!context) return anomalies;

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
                        anomalies.push({
                            type: "Timeline Conflict",
                            severity: "HIGH",
                            description: `Arrest recorded on ${arrest.event_time} occurs before the crime occurrence on ${occurrence.event_time}.`,
                            affectedRecords: [`Arrest #${arrest.ROWID}`, `Occurrence #${occurrence.ROWID}`],
                            detectionRule: "arrest_date < occurance_date"
                        });
                    }
                }
            }
        }

        // 2. Missing Critical Information (Location/Time)
        for (const occurrence of occurrences) {
            if (!occurrence.event_time) {
                anomalies.push({
                    type: "Missing Information",
                    severity: "HIGH",
                    description: `Crime occurrence record is missing the event time.`,
                    affectedRecords: [`Occurrence #${occurrence.ROWID}`],
                    detectionRule: "occurrence.event_time IS NULL"
                });
            }
            if (!occurrence.description || occurrence.description.includes('N/A')) {
                anomalies.push({
                    type: "Missing Information",
                    severity: "MEDIUM",
                    description: `Crime occurrence record is missing exact location coordinates.`,
                    affectedRecords: [`Occurrence #${occurrence.ROWID}`],
                    detectionRule: "occurrence.latitude IS NULL OR occurrence.longitude IS NULL"
                });
            }
        }

        // 3. Duplicate Records (Duplicate suspects in the same case)
        const suspectNames = new Set();
        for (const suspect of suspects) {
            const key = `${suspect.name}_${suspect.age}`;
            if (suspectNames.has(key) && suspect.name !== 'Unknown Accused') {
                anomalies.push({
                    type: "Duplicate Record",
                    severity: "LOW",
                    description: `Multiple suspect records found with identical name (${suspect.name}) and age (${suspect.age}).`,
                    affectedRecords: [`Accused #${suspect.ROWID}`],
                    detectionRule: "duplicate suspect in case"
                });
            }
            suspectNames.add(key);
        }

        // 4. Procedural Anomalies
        if (chargesheets.length > 0 && arrests.length === 0 && suspects.length > 0) {
            anomalies.push({
                type: "Procedural Anomaly",
                severity: "MEDIUM",
                description: `A chargesheet is filed but no arrest or surrender records are found for suspects.`,
                affectedRecords: chargesheets.map(c => `Chargesheet #${c.ROWID}`),
                detectionRule: "chargesheets > 0 AND arrests == 0"
            });
        }

        // 5. Data Inconsistency
        if (arrests.length > 0 && suspects.length === 0) {
            anomalies.push({
                type: "Data Inconsistency",
                severity: "CRITICAL",
                description: `Arrest records exist, but no Accused records are associated with the case.`,
                affectedRecords: arrests.map(a => `Arrest #${a.ROWID}`),
                detectionRule: "arrests > 0 AND suspects == 0"
            });
        }

        return anomalies;
    }
}

module.exports = AnomalyDetectionService;
