import React, { useState } from 'react';
import { Table, Download, FileJson, Code } from 'lucide-react';

const ResultRenderer = ({ data, generatedSql }) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'json'

  if (!data || data.length === 0) {
    return (
      <div style={{ 
        background: 'var(--bg-secondary)', 
        border: '1px solid var(--border-color)', 
        padding: '36px', 
        textAlign: 'center', 
        color: 'var(--text-secondary)',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        No records found matching this query in the Catalyst Datastore.
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
    a.download = `vikshana_query_export_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div style={{ 
      background: 'var(--bg-secondary)', 
      borderRadius: '16px', 
      border: '1px solid var(--border-color)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)'
    }}>
      
      {/* Header Bar */}
      <div style={{ 
        padding: '18px 24px', 
        borderBottom: '1px solid var(--border-color)', 
        background: 'var(--bg-secondary)',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
            <Table size={18} color="var(--accent-primary)" />
            Query Results <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 'normal' }}>({data.length} records)</span>
          </h3>
          <div style={{ 
            fontSize: '13px', 
            color: '#5b21b6', 
            fontFamily: '"Fira Code", monospace', 
            background: '#f5f3ff', 
            border: '1px solid #ddd6fe',
            padding: '8px 12px', 
            borderRadius: '8px', 
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <Code size={15} style={{ flexShrink: 0 }} color="#7c3aed" />
            <span style={{ wordBreak: 'break-all', fontWeight: '500' }}>{generatedSql}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 12px',
                background: viewMode === 'table' ? 'var(--bg-secondary)' : 'transparent',
                color: viewMode === 'table' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: viewMode === 'table' ? '600' : '500',
                boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <Table size={14} /> Table
            </button>
            <button
              onClick={() => setViewMode('json')}
              style={{
                padding: '6px 12px',
                background: viewMode === 'json' ? 'var(--bg-secondary)' : 'transparent',
                color: viewMode === 'json' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: viewMode === 'json' ? '600' : '500',
                boxShadow: viewMode === 'json' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <FileJson size={14} /> JSON
            </button>
          </div>
          
          <button
            onClick={exportCSV}
            style={{
              padding: '7px 14px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.color = 'var(--accent-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Data Viewer */}
      <div style={{ overflowX: 'auto', maxHeight: '550px', overflowY: 'auto' }}>
        {viewMode === 'table' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-tertiary)', zIndex: 1 }}>
              <tr>
                {columns.map(col => (
                  <th key={col} style={{ 
                    padding: '12px 18px', 
                    color: 'var(--text-secondary)', 
                    fontWeight: '600', 
                    borderBottom: '1px solid var(--border-color)',
                    textTransform: 'uppercase',
                    fontSize: '11px',
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
                  borderBottom: '1px solid var(--border-color)', 
                  background: i % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                  transition: 'background 0.15s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-primary-light, #eff6ff)'}
                onMouseOut={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)'}
                >
                  {columns.map(col => (
                    <td key={col} style={{ 
                      padding: '12px 18px', 
                      color: 'var(--text-primary)', 
                      maxWidth: '300px', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      fontWeight: '400'
                    }} title={String(row[col])}>
                      {String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '20px', background: 'var(--bg-tertiary)' }}>
            <pre style={{ margin: 0, color: 'var(--text-primary)', fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: '"Fira Code", monospace' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultRenderer;
