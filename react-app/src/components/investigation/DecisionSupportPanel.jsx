import React from 'react';
import HypothesisPanel from './HypothesisPanel';
import ActionManagementPanel from './ActionManagementPanel';
import EvidenceImpactTimeline from './EvidenceImpactTimeline';

const DecisionSupportPanel = ({ caseId }) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <HypothesisPanel caseId={caseId} />
                <EvidenceImpactTimeline caseId={caseId} />
            </div>
            <div>
                <ActionManagementPanel caseId={caseId} />
            </div>
        </div>
    );
};

export default DecisionSupportPanel;
