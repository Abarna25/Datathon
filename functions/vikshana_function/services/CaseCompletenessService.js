const ContextBuilderService = require('./ContextBuilderService');

class CaseCompletenessService {
    /**
     * Calculates deterministic case completeness score based on actual available data.
     */
    static async calculateCompleteness(req, caseId) {
        // Enforce strict datastore requirement for case completeness
        if (req) {
            req.requireRealData = true;
        }

        // Fetch real data using existing secure context builder
        let context;
        try {
            context = await ContextBuilderService.buildCaseContext(req, caseId);
        } catch (err) {
            if (err.code === 'DATASTORE_UNAVAILABLE') {
                throw err;
            }
            throw err;
        }
        
        if (!context || !context.case) {
            throw new Error(`Case not found or inaccessible: ${caseId}`);
        }

        const categories = [];
        let totalScore = 0;
        const missingItems = [];

        // 1. FIR / Case Information (20 points)
        const hasCaseInfo = context.case && (context.case.briefFacts || context.case.title);
        if (hasCaseInfo) {
            categories.push({
                key: 'case_information',
                label: 'FIR / Case Information',
                weight: 20,
                score: 20,
                status: 'complete',
                reason: 'Primary case record is available.'
            });
            totalScore += 20;
        } else {
            categories.push({
                key: 'case_information',
                label: 'FIR / Case Information',
                weight: 20,
                score: 0,
                status: 'incomplete',
                reason: 'Primary case record or brief facts are missing.'
            });
            missingItems.push('FIR / Case brief facts');
        }

        // 2. Victim Information (20 points)
        if (context.victims && context.victims.length > 0) {
            categories.push({
                key: 'victim_information',
                label: 'Victim Information',
                weight: 20,
                score: 20,
                status: 'complete',
                reason: `${context.victims.length} victim record(s) available.`
            });
            totalScore += 20;
        } else {
            categories.push({
                key: 'victim_information',
                label: 'Victim Information',
                weight: 20,
                score: 0,
                status: 'incomplete',
                reason: 'No victim records found.'
            });
            missingItems.push('Victim details');
        }

        // 3. Accused Information (20 points)
        if (context.suspects && context.suspects.length > 0) {
            categories.push({
                key: 'accused_information',
                label: 'Accused Information',
                weight: 20,
                score: 20,
                status: 'complete',
                reason: `${context.suspects.length} accused record(s) available.`
            });
            totalScore += 20;
        } else {
            categories.push({
                key: 'accused_information',
                label: 'Accused Information',
                weight: 20,
                score: 0,
                status: 'incomplete',
                reason: 'No accused records found.'
            });
            missingItems.push('Accused details');
        }

        // 4. Timeline / Occurrence / Arrest Information (20 points)
        if (context.timeline && context.timeline.length > 0) {
            categories.push({
                key: 'timeline_information',
                label: 'Timeline Information',
                weight: 20,
                score: 20,
                status: 'complete',
                reason: 'Timeline records (occurrence or arrest) are available.'
            });
            totalScore += 20;
        } else {
            categories.push({
                key: 'timeline_information',
                label: 'Timeline Information',
                weight: 20,
                score: 0,
                status: 'incomplete',
                reason: 'No occurrence or arrest records found.'
            });
            missingItems.push('Occurrence/Arrest timeline details');
        }

        // 5. Chargesheet Information (10 points)
        if (context.chargesheet && context.chargesheet.length > 0) {
            categories.push({
                key: 'chargesheet_information',
                label: 'Chargesheet Information',
                weight: 10,
                score: 10,
                status: 'complete',
                reason: 'Chargesheet record is available.'
            });
            totalScore += 10;
        } else {
            categories.push({
                key: 'chargesheet_information',
                label: 'Chargesheet Information',
                weight: 10,
                score: 0,
                status: 'incomplete',
                reason: 'No chargesheet records found.'
            });
            missingItems.push('Chargesheet information');
        }

        // 6. Legal Sections Information (10 points)
        if (context.sections && context.sections.length > 0) {
            categories.push({
                key: 'sections_information',
                label: 'Legal Sections',
                weight: 10,
                score: 10,
                status: 'complete',
                reason: 'Act and Section associations are available.'
            });
            totalScore += 10;
        } else {
            categories.push({
                key: 'sections_information',
                label: 'Legal Sections',
                weight: 10,
                score: 0,
                status: 'incomplete',
                reason: 'No legal section associations found.'
            });
            missingItems.push('Legal Act/Section details');
        }

        // Calculate Status
        let status = 'INCOMPLETE';
        if (totalScore >= 90) status = 'COMPLETE';
        else if (totalScore >= 75) status = 'MOSTLY_COMPLETE';
        else if (totalScore >= 50) status = 'PARTIALLY_COMPLETE';

        let summary = 'Case information is fully complete.';
        if (totalScore < 100) {
            summary = `Case is ${status.replace('_', ' ').toLowerCase()}. The following information is missing: ${missingItems.join(', ')}.`;
        }
        if (totalScore === 0) {
            summary = 'Case is completely missing structured data except for basic ID.';
        }

        return {
            caseId: context.case.caseId,
            score: totalScore,
            status,
            categories,
            missingItems,
            summary
        };
    }
}

module.exports = CaseCompletenessService;
