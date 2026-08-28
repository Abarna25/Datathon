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
  let confColor = 'var(--text-secondary)';
  let ConfIcon = Info;
  
  if (confUpper.includes('HIGH')) {
    confColor = 'var(--accent-success, #10b981)'; 
    ConfIcon = CheckCircle2;
  }
  if (confUpper.includes('MEDIUM')) {
    confColor = 'var(--accent-warning, #f59e0b)';
    ConfIcon = ShieldAlert;
  }
  if (confUpper.includes('LOW')) {
    confColor = 'var(--accent-danger, #ef4444)';
    ConfIcon = ShieldAlert;
  }

  return (
    <div style={{ 
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '16px',
      padding: '20px 24px',
      display: 'flex', 
      gap: '16px',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'rgba(37, 99, 235, 0.08)',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent-primary)'
        }}>
          <Cpu size={22} />
        </div>
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)', fontWeight: '600' }}>
            Query Analysis & Synthesis
          </h3>
          {confidence && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px',
              border: `1px solid ${confColor}40`, color: confColor, background: `${confColor}15`
            }}>
              <ConfIcon size={13} />
              {confidence.toUpperCase()}
            </div>
          )}
        </div>
        
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
          <div style={{ 
            marginBottom: filters ? '12px' : '0', 
            padding: '12px 16px', 
            background: 'var(--bg-tertiary)', 
            borderRadius: '10px', 
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)'
          }}>
            {reasoning || explanation}
          </div>
          
          {filters && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '4px', borderRadius: '6px' }}>
                <Info size={14} color="var(--accent-primary)" />
              </div>
              <div style={{ paddingTop: '1px', fontSize: '13px' }}>
                <strong style={{ color: 'var(--text-primary)', fontWeight: '600', marginRight: '6px' }}>Filters Applied:</strong> 
                <span style={{ color: 'var(--text-secondary)' }}>{filters}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplanationPanel;
