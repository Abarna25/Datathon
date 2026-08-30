import React, { useState } from 'react';
import { FileText, MapPin, Calendar, User, Users, Target, Database, ChevronDown, ChevronUp } from 'lucide-react';

const FIRSummaryPanel = ({ bundle }) => {
  const [collapsed, setCollapsed] = useState(false);

  if (!bundle) return null;
  const fir = bundle.firSummary || {};

  const stats = [
    { label: 'Victims', value: fir.victimsCount ?? (bundle.victims?.length || 0), icon: Users, color: '#ef4444' },
    { label: 'Suspects', value: fir.suspectsCount ?? (bundle.suspects?.length || 0), icon: Target, color: '#f97316' },
    { label: 'Evidence', value: fir.evidenceCount ?? (bundle.evidence?.length || 0), icon: Database, color: '#8b5cf6' },
    { label: 'Witnesses', value: bundle.witnesses?.length || 0, icon: Users, color: '#3b82f6' },
  ];

  return (
    <div className="glass-panel" style={{ padding: '12px 16px', marginBottom: '12px', borderLeft: '4px solid var(--accent-primary)', borderRadius: '10px' }}>
      <div 
        onClick={() => setCollapsed(!collapsed)} 
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} color="var(--accent-primary)" />
          <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)', fontWeight: '700' }}>FIR Summary</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
            {fir.crime || bundle.category || 'General'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {stats.map(({ label, value, color }) => (
              <span key={label} style={{ fontSize: '11px', background: `${color}20`, color: color, padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
                {value} {label}
              </span>
            ))}
          </div>
          {collapsed ? <ChevronDown size={18} color="var(--text-secondary)" /> : <ChevronUp size={18} color="var(--text-secondary)" />}
        </div>
      </div>

      {!collapsed && (
        <div style={{ marginTop: '10px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700' }}>Crime Type</span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>{fir.crime || bundle.category || '—'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={10} />Date</span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>{fir.date || bundle.date || '—'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={10} />Police Station</span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>{fir.policeStation || bundle.policeStation || '—'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={10} />Officer</span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>{fir.officer || bundle.officer || '—'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FIRSummaryPanel;
