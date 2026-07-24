import React, { useState } from 'react';
import QueryInput from '../components/DataExplorer/QueryInput';
import ResultRenderer from '../components/DataExplorer/ResultRenderer';
import ExplanationPanel from '../components/DataExplorer/ExplanationPanel';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import { Database, AlertTriangle } from 'lucide-react';

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
      // Pass the globally active case ID to scope the AI query generation
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
      console.error('Text-to-SQL Error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to execute AI query.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Database size={32} color="var(--accent-primary)" />
          Text-to-SQL AI Data Explorer
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '15px' }}>
          Use natural language to query the Data Store. The AI securely translates your requests into ZCQL and scopes the search to the active case.
        </p>
      </header>

      <QueryInput onExecute={handleExecuteQuery} isLoading={isLoading} />

      {error && (
        <div style={{ 
          padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', 
          borderRadius: '8px', color: '#ef4444', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' 
        }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {queryState.results && (
        <>
          <ResultRenderer data={queryState.results} generatedSql={queryState.sql} />
          <ExplanationPanel explanation={queryState.explanation} />
        </>
      )}

      {!queryState.results && !isLoading && !error && (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Database size={48} color="rgba(255,255,255,0.1)" />
          <p style={{ margin: 0, maxWidth: '400px' }}>
            Enter a query above to start exploring. Example: <em>"Find suspects matching the active case"</em>.
          </p>
        </div>
      )}
    </div>
  );
};

export default DataExplorer;
