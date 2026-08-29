/**
 * sentinelService.js
 * Frontend client service for communicating with the VIKSHANA Sentinel REST API.
 */

import api from './api';

export const sentinelService = {
  /**
   * Fetches latest Sentinel triage dashboard state.
   */
  async getDashboard() {
    const res = await api.get('/sentinel/dashboard');
    return res.data || { success: false };
  },

  /**
   * Triggers an on-demand full Sentinel scan across active dockets.
   */
  async triggerScan(limit = 100) {
    const res = await api.post('/sentinel/scan', { limit });
    return res.data || { success: false };
  },

  /**
   * Fetches the prioritized action queue.
   */
  async getActions(params = {}) {
    const res = await api.get('/sentinel/actions', { params });
    return res.data?.data || [];
  },

  /**
   * Fetches the granular triage scorecard for a specific case.
   */
  async getCaseTriage(caseId) {
    const res = await api.get(`/sentinel/cases/${caseId}/triage`);
    return res.data || { success: false };
  },

  /**
   * Submits a Human-in-the-Loop decision (APPROVE or DISMISS).
   */
  async recordDecision(actionId, decision, reason = '') {
    const res = await api.post(`/sentinel/actions/${actionId}/decision`, { decision, reason });
    return res.data || { success: false };
  },

  /**
   * Fetches the tamper-proof decision audit trail.
   */
  async getDecisionAuditTrail(caseId = null) {
    const params = caseId ? { caseId } : {};
    const res = await api.get('/sentinel/audit-trail', { params });
    return res.data?.data || [];
  }
};

export default sentinelService;
