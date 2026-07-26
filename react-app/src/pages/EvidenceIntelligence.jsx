import React, { useState, useEffect } from 'react';
import { Database, Loader2, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import AIAssistantPanel from '../components/AIAssistantPanel';

import EvidenceSummaryCards from '../components/evidence/EvidenceSummaryCards';
import EvidenceGapAnalysis from '../components/evidence/EvidenceGapAnalysis';
import RecommendationPanel from '../components/evidence/RecommendationPanel';
import EvidenceCorrelationGraph from '../components/evidence/EvidenceCorrelationGraph';
import EvidenceTimeline from '../components/evidence/EvidenceTimeline';
import CopilotAssistantPanel from '../components/evidence/CopilotAssistantPanel';

const EvidenceIntelligence = () => {
  const [workspaceData, setWorkspaceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { activeCaseId } = useAppContext();
  // Using the globally selected active case ID
  const caseId = activeCaseId;

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const response = await api.get(`/evidence-intelligence/workspace?caseId=${caseId}`);
        if (response.data.success) {
          setWorkspaceData(response.data.data);
        } else {
          throw new Error(response.data.error || 'Failed to load workspace');
        }
      } catch (err) {
        console.debug('Evidence Workspace Error:', err);
        setError('Failed to load Evidence Workspace. Ensure the backend is reachable.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspace();
  }, [caseId]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--accent-primary)' }}>
        <Loader2 size={48} className="spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <AlertTriangle size={32} />
        <h2>{error}</h2>
      </div>
    );
  }

  if (!workspaceData) return null;

  const { unified_evidence, correlations, gaps, recommendations } = workspaceData;

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', width: '100%', paddingBottom: '40px' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Database size={32} color="var(--accent-primary)" />
          Unified Evidence Workspace
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '15px' }}>
          Aggregated case evidence, AI cross-correlations, gap analysis, and interactive copilot.
        </p>
      </header>

      <AIAssistantPanel 
        title="AI Evidence Insights" 
        content="**High Priority**: DNA forensic results cross-matched with 2 external jurisdictions. Potential weapon match identified in Case #4419. I recommend issuing a supplemental forensic order on the recovered vehicle."
        delay={800}
      />

      <EvidenceSummaryCards summary={unified_evidence?.summary} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px' }}>
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <EvidenceGapAnalysis gaps={gaps} />
            <RecommendationPanel recommendations={recommendations} />
          </div>

          <EvidenceCorrelationGraph correlations={correlations} evidence={unified_evidence?.evidence || []} caseId={caseId} />
          
          <EvidenceTimeline evidence={unified_evidence?.evidence} />

        </div>

        {/* Copilot Assistant Area */}
        <div>
          <div style={{ position: 'sticky', top: '20px' }}>
            <CopilotAssistantPanel caseId={caseId} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvidenceIntelligence;
