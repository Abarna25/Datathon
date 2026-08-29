/**
 * foresightService.js
 * Frontend API client for VIKSHANA 3.0 Foresight Predictive Intelligence
 */

import api from './api';

const foresightService = {
    /**
     * Assesses an accused person using the supervised ML model
     */
    assessAccused: async (accusedName, caseId = null) => {
        const response = await api.post('/foresight/assess', { accusedName, caseId });
        return response.data;
    },

    /**
     * Assesses all suspects linked to a case
     */
    assessCaseSuspects: async (caseId) => {
        const response = await api.get(`/foresight/cases/${caseId}/assessments`);
        return response.data;
    },

    /**
     * Fetches certified Model Card metadata
     */
    getModelCard: async () => {
        const response = await api.get('/foresight/model-card');
        return response.data?.modelCard || response.data;
    },

    /**
     * Submits an officer review decision (ACKNOWLEDGE, DISMISS, REQUEST_MORE_INFO)
     */
    submitOfficerDecision: async ({ assessmentId, accusedName, caseId, decision, officerNotes }) => {
        const response = await api.post('/foresight/decision', {
            assessmentId,
            accusedName,
            caseId,
            decision,
            officerNotes
        });
        return response.data;
    },

    /**
     * Fetches historical decision audit trail
     */
    getAuditTrail: async (limit = 50) => {
        const response = await api.get(`/foresight/audit-trail?limit=${limit}`);
        return response.data;
    }
};

export default foresightService;
