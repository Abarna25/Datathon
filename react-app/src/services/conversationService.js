import api from './api';

// Every call here uses the shared axios instance — non-streaming only.
// The one streaming call (sending a chat message) intentionally bypasses
// axios and uses raw `fetch` inside `hooks/useStreamingChat.js`, since axios
// has no browser streaming-reader support. Do not "fix" that back to axios.

export function listCases() {
    return api.get('/cases')
        .then((r) => r.data.data)
        .catch((err) => {
            console.warn('[listCases] error:', err.message);
            return [];
        });
}

export function getCaseSummary(caseId) {
    return api.get(`/cases/${caseId}/summary`)
        .then((r) => r.data.data)
        .catch((err) => {
            console.warn('[getCaseSummary] error:', err.message);
            return null;
        });
}

export function listWitnesses(caseId) {
    return api.get(`/cases/${caseId}/witnesses`)
        .then((r) => r.data.data)
        .catch(() => []);
}

export function listSuspects(caseId) {
    return api.get(`/cases/${caseId}/suspects`)
        .then((r) => r.data.data)
        .catch(() => []);
}

export function listCctv(caseId) {
    return api.get(`/cases/${caseId}/cctv`)
        .then((r) => r.data.data)
        .catch(() => []);
}

export function listPhoneRecords(caseId) {
    return api.get(`/cases/${caseId}/phone-records`)
        .then((r) => r.data.data)
        .catch(() => []);
}

export function listFinancialTransactions(caseId) {
    return api.get(`/cases/${caseId}/financial-transactions`)
        .then((r) => r.data.data)
        .catch(() => []);
}

export function listTimeline(caseId) {
    return api.get(`/cases/${caseId}/timeline`)
        .then((r) => r.data.data)
        .catch(() => []);
}

export function listConversations(caseId, officerId) {
    return api.get('/conversations', { params: { caseId: caseId || 'global', officerId: officerId || 'System' } })
        .then((r) => {
            const d = r.data?.data || r.data;
            return Array.isArray(d) ? d : [];
        })
        .catch((err) => {
            console.warn('[listConversations] error:', err.message);
            return [];
        });
}

export function createConversation(caseId, officerId, title) {
    return api.post('/conversations', { 
        caseId: caseId || 'global', 
        officerId: officerId || 'System', 
        title: title || 'New Investigation Chat' 
    })
        .then((r) => {
            const d = r.data?.data || r.data;
            if (d && d.id) return d;
            return { 
                id: `CONV-${Date.now()}`, 
                caseId: caseId || 'global', 
                officerId: officerId || 'System', 
                title: title || 'New Investigation Chat', 
                messages: [] 
            };
        })
        .catch((err) => {
            console.warn('[createConversation] error:', err.message);
            return { 
                id: `CONV-${Date.now()}`, 
                caseId: caseId || 'global', 
                officerId: officerId || 'System', 
                title: title || 'New Investigation Chat', 
                messages: [] 
            };
        });
}

export function getConversation(conversationId) {
    if (!conversationId) return Promise.resolve(null);
    return api.get(`/conversations/${conversationId}`)
        .then((r) => {
            const d = r.data?.data || r.data;
            if (d && (d.id || d.messages)) return d;
            return null;
        })
        .catch((err) => {
            console.warn('[getConversation] error:', err.message);
            return null;
        });
}

export function updateConversation(conversationId, patch) {
    return api.patch(`/conversations/${conversationId}`, patch)
        .then((r) => r.data.data)
        .catch((err) => {
            console.warn('[updateConversation] error:', err.message);
            return { id: conversationId, ...patch };
        });
}

export function deleteConversation(conversationId) {
    return api.delete(`/conversations/${conversationId}`)
        .then((r) => r.data)
        .catch((err) => {
            console.warn('[deleteConversation] error:', err.message);
            return { success: false };
        });
}

/** Fallback / debug path — the real UI uses the streaming endpoint via useStreamingChat.js. */
export function sendMessageNonStreaming(conversationId, content, officerId) {
    return api
        .post(`/conversations/${conversationId}/messages?stream=false`, { content, officerId })
        .then((r) => r.data.data);
}

export function uploadAttachment(conversationId, caseId, file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caseId', caseId);
    return api
        .post(`/conversations/${conversationId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000
        })
        .then((r) => r.data.data);
}

export function generateCaseReport(caseId) {
    return api.post('/reports/generate', { caseId }).then((r) => r.data.data);
}

export function predictSuspectRisk(caseId, suspectId, suspectName) {
    return api.post('/ml/predict-risk', { caseId, suspectId, suspectName }).then((r) => r.data.data);
}

export function predictCrimeHotspots(sectorId = 'Sector-18') {
    return api.get('/ml/predict-hotspots', { params: { sectorId } }).then((r) => r.data.data);
}

export function synthesizeDictation(transcript, caseId, officerId) {
    return api.post('/convokraft/synthesize-dictation', { transcript, caseId, officerId }).then((r) => r.data.data);
}

export function parseVoiceCommand(commandText, caseId) {
    return api.post('/convokraft/voice-command', { commandText, caseId }).then((r) => r.data.data);
}

export function triggerThreatSync() {
    return api.get('/jobs/threat-sync').then((r) => r.data.data);
}

