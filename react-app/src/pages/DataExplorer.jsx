import React, { useState } from 'react';
import QueryInput from '../components/DataExplorer/QueryInput';
import ResultRenderer from '../components/DataExplorer/ResultRenderer';
import ExplanationPanel from '../components/DataExplorer/ExplanationPanel';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import { Database, AlertTriangle, Sparkles, Terminal, Search } from 'lucide-react';

const DataExplorer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { activeCaseId } = useAppContext();
  const [queryState, setQueryState] = useState({
    query: '',
    sql: '',
    results: null,
    explanation: ''
  });

  const handleExecuteQuery = async (query) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/text-to-sql/query', { query, caseId: activeCaseId });
      
      if (response.data.success) {
        setQueryState({
          query: response.data.query,
          sql: response.data.sql,
          results: response.data.results,
          explanation: response.data.explanation
        });
      } else {
        throw new Error(response.data.error || 'Unknown error occurred.');
      }
    } catch (err) {
      console.debug('Text-to-SQL Error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to execute AI query.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dark-theme" style={{ 
      width: '100%',
      height: '100%',
      flex: 1,
      background: 'linear-gradient(145deg, #0b0f19 0%, #131a2a 100%)',
      padding: '40px',
      position: 'relative',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      
      {/* Decorative background glow */}
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <header style={{ marginBottom: '32px', position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ 
            fontSize: '32px', 
            color: '#ffffff', 
            margin: '0 0 12px 0', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            fontWeight: '700',
            letterSpacing: '-0.5px'
          }}>
            <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', padding: '10px', borderRadius: '14px', display: 'flex', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}>
              <Search size={24} color="#ffffff" />
            </div>
            Investigation Search
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '15px', maxWidth: '600px', lineHeight: '1.6' }}>
            Enter a natural language query. The intelligence engine will autonomously synthesize a secure ZCQL database query and retrieve live case data.
          </p>
        </div>
        <div style={{ padding: '8px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
          <span style={{ color: '#10b981', fontSize: '13px', fontWeight: '600' }}>Engine Online</span>
        </div>
      </header>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <QueryInput onExecute={handleExecuteQuery} isLoading={isLoading} />

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '16px', borderRadius: '12px', color: '#ef4444', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
            <AlertTriangle size={20} />
            <div>
              <strong style={{ display: 'block', fontSize: '14px' }}>Query Failed</strong>
              <span style={{ fontSize: '13px', opacity: 0.9 }}>{error}</span>
            </div>
          </div>
        )}

        {queryState.results && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out' }}>
            <ExplanationPanel explanation={queryState.explanation} />
            <ResultRenderer data={queryState.results} generatedSql={queryState.sql} />
          </div>
        )}

        {!queryState.results && !isLoading && !error && (
          <div style={{ 
            background: 'rgba(19, 26, 42, 0.4)', 
            border: '1px dashed rgba(255,255,255,0.1)', 
            padding: '80px 40px', 
            borderRadius: '20px', 
            textAlign: 'center', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '20px',
            marginTop: '24px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'rgba(59,130,246,0.05)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid rgba(59,130,246,0.1)'
            }}>
              <Terminal size={36} color="#3b82f6" />
            </div>
            <div>
              <h3 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>Awaiting Input Parameters</h3>
              <p style={{ color: '#64748b', margin: 0, fontSize: '15px', maxWidth: '400px', lineHeight: '1.6' }}>
                Type a natural language request above. Try asking for specific suspects, evidence, or financial records linked to the active case.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataExplorer;
