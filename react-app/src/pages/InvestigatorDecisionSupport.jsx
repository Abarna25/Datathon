import React from 'react';
import { Compass } from 'lucide-react';
import DecisionSupportPanel from '../components/investigation/DecisionSupportPanel';
import { useAppContext } from '../context/AppContext';

const InvestigatorDecisionSupport = () => {
  const { activeCaseId } = useAppContext();

  if (!activeCaseId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
        No active case selected. Please select a case in the header.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', paddingBottom: '40px' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Compass size={32} color="var(--accent-primary)" />
          Decision Support
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '15px' }}>
          Interactive case brief, AI timelines, similarity matching, and investigative recommendation reports.
        </p>
      </header>

      <div>
        <DecisionSupportPanel caseId={activeCaseId} defaultExpanded={true} />
      </div>
    </div>
  );
};

export default InvestigatorDecisionSupport;
