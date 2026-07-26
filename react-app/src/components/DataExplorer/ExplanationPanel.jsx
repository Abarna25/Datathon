import React from 'react';
import { Cpu, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

const ExplanationPanel = ({ explanation }) => {
  if (!explanation) return null;

  let reasoning = explanation;
  let filters = '';
  let confidence = '';

  const reasoningMatch = explanation.match(/Reasoning:\s*(.*?)(?=Filters Applied:|Confidence:|$)/is);
  const filtersMatch = explanation.match(/Filters Applied:\s*(.*?)(?=Reasoning:|Confidence:|$)/is);
  const confidenceMatch = explanation.match(/Confidence:\s*(.*?)(?=Reasoning:|Filters Applied:|$)/is);

  if (reasoningMatch) reasoning = reasoningMatch[1].trim();
  if (filtersMatch) filters = filtersMatch[1].trim();
  if (confidenceMatch) confidence = confidenceMatch[1].trim();

  const confUpper = confidence.toUpperCase();
  let confColor = '#94a3b8';
  let ConfIcon = Info;
  
  if (confUpper.includes('HIGH')) {
    confColor = '#10b981'; 
    ConfIcon = CheckCircle2;
  }
  if (confUpper.includes('MEDIUM')) {
    confColor = '#f59e0b';
    ConfIcon = ShieldAlert;
  }
  if (confUpper.includes('LOW')) {
    confColor = '#ef4444';
    ConfIcon = ShieldAlert;
  }

  return (
    <div style={{ 
      background: 'rgba(19, 26, 42, 0.7)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '16px',
      padding: '24px',
      display: 'flex', 
      gap: '20px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      backdropFilter: 'blur(12px)'
    }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(139,92,246,0.2) 100%)',
          border: '1px solid rgba(139,92,246,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#a78bfa',
          boxShadow: '0 0 20px rgba(139,92,246,0.1)'
        }}>
          <Cpu size={24} />
        </div>
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#ffffff', fontWeight: '600' }}>
            Neural Synthesis
          </h3>
          {confidence && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px',
              border: `1px solid ${confColor}40`, color: confColor, background: `${confColor}10`
            }}>
              <ConfIcon size={14} />
              {confidence.toUpperCase()}
            </div>
          )}
        </div>
        
        <div style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.7' }}>
          <div style={{ marginBottom: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <span style={{ color: '#e2e8f0' }}>{reasoning || explanation}</span>
          </div>
          
          {filters && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(59,130,246,0.1)', padding: '4px', borderRadius: '6px' }}>
                <Info size={16} color="#3b82f6" />
              </div>
              <div style={{ paddingTop: '2px' }}>
                <strong style={{ color: '#cbd5e1', fontWeight: '600', marginRight: '6px' }}>Scope Filters:</strong> 
                {filters}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplanationPanel;
