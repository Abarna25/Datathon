const ContextBuilderService = require('./ContextBuilderService');

class TimelineIntelligenceService {
    static async getTimelineIntelligence(req, caseId) {
        try {
            // 1. Get raw context
            const context = await ContextBuilderService.buildCaseContext(req, caseId);
            if (!context || !context.case) {
                return { _error: '404' }; // Signal for controller to return 404
            }

            // 2. Normalize events
            let timeline = [];
            
            // A. FIR Registered
            if (context.case.date) {
                timeline.push({
                    eventId: `EVT-FIR-${context.case.ROWID}`,
                    eventType: 'FIR_REGISTERED',
                    date: new Date(context.case.date).toISOString(),
                    description: `FIR Registered for Case ${context.case.caseNumber}`,
                    sourceTable: 'CaseMaster',
                    sourceRecordId: context.case.ROWID,
                    caseId: caseId
                });
            }

            // B. Timeline Events (Occurrence and Arrests)
            if (context.timeline) {
                context.timeline.forEach(t => {
                    if (t.event_time) {
                        const isOcc = t.source_type === 'occurrence_record';
                        timeline.push({
                            eventId: `EVT-${isOcc ? 'OCC' : 'ARR'}-${t.ROWID}`,
                            eventType: isOcc ? 'CRIME_OCCURRENCE' : 'ARREST_SURRENDER',
                            date: new Date(t.event_time).toISOString(),
                            description: t.description || t.title,
                            sourceTable: isOcc ? 'Inv_OccuranceTime' : 'ArrestSurrender',
                            sourceRecordId: t.ROWID,
                            caseId: caseId
                        });
                    }
                });
            }

            // C. Chargesheet
            if (context.chargesheet) {
                context.chargesheet.forEach(cs => {
                    if (cs.csdate) {
                        timeline.push({
                            eventId: `EVT-CS-${cs.ROWID}`,
                            eventType: 'CHARGESHEET_FILED',
                            date: new Date(cs.csdate).toISOString(),
                            description: `Chargesheet type ${cs.cstype || 'N/A'} filed`,
                            sourceTable: 'ChargesheetDetails',
                            sourceRecordId: cs.ROWID,
                            caseId: caseId
                        });
                    }
                });
            }

            // 3. Sort chronologically
            timeline = timeline.filter(e => !isNaN(new Date(e.date).getTime()));
            timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

            const gaps = [];
            const contradictions = [];
            const missingRecords = [];
            const alibiInformationGaps = [];
            const nextBestActions = [];

            if (timeline.length < 2) {
                return {
                    timeline, gaps, contradictions, missingRecords, alibiInformationGaps, nextBestActions,
                    dataCompleteness: { score: 0 },
                    _insufficient: true
                };
            }

            // 4. Gap Detection
            for (let i = 0; i < timeline.length - 1; i++) {
                const current = timeline[i];
                const next = timeline[i + 1];
                const diffMs = new Date(next.date) - new Date(current.date);
                const daysGap = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                if (daysGap > 30) {
                    const isSignificant = daysGap > 90;
                    gaps.push({
                        type: isSignificant ? "SIGNIFICANT_GAP" : "INVESTIGATION_GAP",
                        fromEvent: current.eventId,
                        toEvent: next.eventId,
                        gapDays: daysGap,
                        severity: isSignificant ? "HIGH" : "MEDIUM",
                        what: `${daysGap}-day period with no recorded investigation event`,
                        why: "No timeline records were found between the two available events",
                        source: [current.sourceTable, next.sourceTable],
                        confidence: "HIGH"
                    });

                    nextBestActions.push({
                        action: "Review case records for unrecorded investigative activity during the identified period.",
                        reasoning: `To cover the ${daysGap}-day gap between ${current.eventType} and ${next.eventType}.`,
                        source: [current.sourceTable, next.sourceTable]
                    });
                } else if (daysGap > 0) {
                    gaps.push({
                        type: "NORMAL",
                        fromEvent: current.eventId,
                        toEvent: next.eventId,
                        gapDays: daysGap,
                        severity: "LOW",
                        what: `${daysGap}-day period between events`,
                        why: "Standard interval between investigation events",
                        source: [current.sourceTable, next.sourceTable],
                        confidence: "HIGH"
                    });
                }
            }

            // 5. Date Contradiction Detection
            const occurrence = timeline.find(e => e.eventType === 'CRIME_OCCURRENCE');
            const arrest = timeline.find(e => e.eventType === 'ARREST_SURRENDER');
            const chargesheet = timeline.find(e => e.eventType === 'CHARGESHEET_FILED');
            const fir = timeline.find(e => e.eventType === 'FIR_REGISTERED');

            if (occurrence && arrest && new Date(arrest.date) < new Date(occurrence.date)) {
                contradictions.push({
                    type: "TIMELINE_CONTRADICTION",
                    severity: "HIGH",
                    what: "Arrest date precedes recorded occurrence date",
                    why: "The recorded arrest date occurs before the recorded occurrence date",
                    source: ['Inv_OccuranceTime', 'ArrestSurrender'],
                    confidence: "HIGH"
                });
                nextBestActions.push({
                    action: "Verify the source records and confirm the correct dates.",
                    reasoning: "Resolve chronological conflict between occurrence and arrest.",
                    source: ['Inv_OccuranceTime', 'ArrestSurrender']
                });
            }
            
            if (chargesheet && fir && new Date(chargesheet.date) < new Date(fir.date)) {
                contradictions.push({
                    type: "TIMELINE_CONTRADICTION",
                    severity: "HIGH",
                    what: "Chargesheet date precedes FIR registration date",
                    why: "The recorded chargesheet date occurs before the FIR was registered",
                    source: ['ChargesheetDetails', 'CaseMaster'],
                    confidence: "HIGH"
                });
                nextBestActions.push({
                    action: "Verify the source records and confirm the correct dates.",
                    reasoning: "Resolve chronological conflict between FIR and chargesheet.",
                    source: ['ChargesheetDetails', 'CaseMaster']
                });
            }

            if (chargesheet && occurrence && new Date(chargesheet.date) < new Date(occurrence.date)) {
                contradictions.push({
                    type: "TIMELINE_CONTRADICTION",
                    severity: "HIGH",
                    what: "Chargesheet date precedes recorded occurrence date",
                    why: "The recorded chargesheet date occurs before the crime was committed",
                    source: ['ChargesheetDetails', 'Inv_OccuranceTime'],
                    confidence: "HIGH"
                });
            }
            
            if (chargesheet && arrest && new Date(chargesheet.date) < new Date(arrest.date)) {
                contradictions.push({
                    type: "TIMELINE_CONTRADICTION",
                    severity: "HIGH",
                    what: "Chargesheet date precedes arrest date",
                    why: "The recorded chargesheet date occurs before the recorded arrest",
                    source: ['ChargesheetDetails', 'ArrestSurrender'],
                    confidence: "HIGH"
                });
            }

            // 6. Missing Record Detection
            if (chargesheet && !arrest) {
                missingRecords.push({
                    type: "POTENTIAL_MISSING_RECORD",
                    what: "Chargesheet record exists but no linked arrest/surrender record was found",
                    why: "The available case records contain a chargesheet but no corresponding arrest/surrender entry",
                    source: ['ChargesheetDetails', 'ArrestSurrender'],
                    confidence: "MEDIUM"
                });
            }

            if (fir && !occurrence) {
                missingRecords.push({
                    type: "POTENTIAL_MISSING_RECORD",
                    what: "FIR record exists but no linked occurrence time record was found",
                    why: "The available case records contain an FIR but no corresponding occurrence time entry",
                    source: ['CaseMaster', 'Inv_OccuranceTime'],
                    confidence: "HIGH"
                });
            }

            // 7. Alibi Information Gap Detection
            // Check if suspects exist but have no associated timeline events for long periods.
            if (context.suspects && context.suspects.length > 0) {
                for (const suspect of context.suspects) {
                    // In real data, only ArrestSurrender explicitly links to AccusedMasterID.
                    const suspectEvents = context.timeline.filter(t => t.source_type === 'arrest_record' && t.accused_id === suspect.ROWID);
                    if (suspectEvents.length === 0 && occurrence) {
                        // Suspect exists, occurrence happened, but no records for this suspect.
                        const today = new Date();
                        const occDate = new Date(occurrence.date);
                        const gapDays = Math.floor((today - occDate) / (1000 * 60 * 60 * 24));
                        
                        if (gapDays > 30) {
                            alibiInformationGaps.push({
                                type: "ALIBI_INFORMATION_GAP",
                                personId: suspect.ROWID,
                                fromDate: occurrence.date,
                                toDate: today.toISOString(),
                                gapDays: gapDays,
                                what: "No recorded case-related event for this person during this period",
                                why: "Available datastore records contain no linked event during this period",
                                source: ["Accused", "ArrestSurrender"],
                                confidence: "LOW"
                            });
                        }
                    }
                }
            }

            // 8. Data Completeness
            let expectedMilestones = 4; // FIR, Occurrence, Arrest, Chargesheet
            let presentMilestones = (fir ? 1 : 0) + (occurrence ? 1 : 0) + (arrest ? 1 : 0) + (chargesheet ? 1 : 0);
            const dataCompleteness = {
                score: Math.round((presentMilestones / expectedMilestones) * 100),
                milestones: {
                    fir: !!fir,
                    occurrence: !!occurrence,
                    arrest: !!arrest,
                    chargesheet: !!chargesheet
                }
            };

            return {
                timeline,
                gaps,
                contradictions,
                missingRecords,
                alibiInformationGaps,
                nextBestActions,
                dataCompleteness
            };
        } catch (e) {
            console.error("TimelineIntelligenceService error:", e);
            return { _error: '500' };
        }
    }
}

module.exports = TimelineIntelligenceService;
