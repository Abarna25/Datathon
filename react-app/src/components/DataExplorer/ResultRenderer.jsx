import React, { useState } from 'react';
import { Table, Download, FileJson, Code } from 'lucide-react';

const ResultRenderer = ({ data, generatedSql }) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'json'

  if (!data || data.length === 0) {
    return (
      <div style={{ 
        background: 'rgba(19, 26, 42, 0.7)', 
        border: '1px solid rgba(255,255,255,0.05)', 
        padding: '40px', 
        textAlign: 'center', 
        color: '#94a3b8',
        borderRadius: '16px'
      }}>
        No results found for this query in the current case.
      </div>
    );
  }

  const columns = Object.keys(data[0] || {}).filter(k => k !== '_tableName');

  const exportCSV = () => {
    if (!data.length) return;
    const header = columns.join(',');
    const rows = data.map(row => columns.map(col => `"${String(row[col] || '').replace(/"/g, '""')}"`).join(','));
    const csv = [header, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_export_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div style={{ 
      background: 'rgba(19, 26, 42, 0.8)', 
      borderRadius: '20px', 
      border: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      backdropFilter: 'blur(12px)'
    }}>
      
      {/* Header Bar */}
      <div style={{ 
        padding: '20px 24px', 
        borderBottom: '1px solid rgba(255,255,255,0.08)', 
        background: 'rgba(0,0,0,0.2)',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start'
      }}>
        <div style={{ flex: 1, marginRight: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#ffffff', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Table size={20} color="#3b82f6" />
            Query Results <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 'normal' }}>({data.length} records)</span>
          </h3>
          <div style={{ 
            fontSize: '13px', 
            color: '#a78bfa', 
            fontFamily: '"Fira Code", monospace', 
            background: 'rgba(139, 92, 246, 0.08)', 
            border: '1px solid rgba(139, 92, 246, 0.2)',
            padding: '10px 14px', 
            borderRadius: '8px', 
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <Code size={16} style={{ flexShrink: 0 }} />
            <span style={{ wordBreak: 'break-all' }}>{generatedSql}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '8px 12px',
                background: viewMode === 'table' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : '#64748b',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              <Table size={16} /> Table
            </button>
            <button
              onClick={() => setViewMode('json')}
              style={{
                padding: '8px 12px',
                background: viewMode === 'json' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: viewMode === 'json' ? '#ffffff' : '#64748b',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              <FileJson size={16} /> JSON
            </button>
          </div>
          
          <button
            onClick={exportCSV}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
            onMouseOut={(e) => e.target.style.background = 'transparent'}
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Data Viewer */}
      <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
        {viewMode === 'table' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', zIndex: 1 }}>
              <tr>
                {columns.map(col => (
                  <th key={col} style={{ 
                    padding: '16px 24px', 
                    color: '#94a3b8', 
                    fontWeight: '600', 
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    textTransform: 'uppercase',
                    fontSize: '12px',
                    letterSpacing: '0.5px'
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} style={{ 
                  borderBottom: '1px solid rgba(255,255,255,0.04)', 
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
                onMouseOut={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                >
                  {columns.map(col => (
                    <td key={col} style={{ 
                      padding: '16px 24px', 
                      color: '#e2e8f0', 
                      maxWidth: '300px', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis' 
                    }} title={String(row[col])}>
                      {String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '24px', background: '#0a0b10' }}>
            <pre style={{ margin: 0, color: '#60a5fa', fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: '"Fira Code", monospace' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultRenderer;
