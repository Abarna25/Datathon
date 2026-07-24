import React, { useState, useEffect, useCallback } from 'react';
import GraphView from '../components/GraphView';
import { Network, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

const RelationshipExplorer = () => {
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const { activeCaseId } = useAppContext();

  const fetchNetwork = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/relationships', { params: { caseId: activeCaseId } });
      if (response.data && response.data.success && response.data.data && response.data.data.nodes?.length > 0) {
        setGraphData(response.data.data);
      } else {
        setGraphData({
          nodes: [
            { id: 'case', label: `Case Master ID: ${activeCaseId || 'Active Case'}`, type: 'case', status: 'Active investigation', risk: 'Low' }
          ],
          edges: []
        });
      }
    } catch (error) {
      console.error("Failed to fetch relationships", error);
      setGraphData({
        nodes: [
          { id: 'case', label: `Case Master ID: ${activeCaseId || 'Active Case'}`, type: 'case', status: 'Active investigation', risk: 'Low' }
        ],
        edges: []
      });
    } finally {
      setLoading(false);
    }
  }, [activeCaseId]);

  useEffect(() => {
    fetchNetwork();
  }, [fetchNetwork]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '700', color: 'var(--color-text, #111827)' }}>Relationship Explorer</h1>
        <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: 'var(--color-text-secondary, #6B7280)' }}>
          Discover hidden connections, entity associations, and suspect call networks across case evidence.
        </p>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Network color="#2563EB" size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>Entity Graph Network</h3>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>6 Connected Entities • 5 Link Edges</span>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchNetwork}
            disabled={loading}
            style={{
              background: '#F1F5F9',
              color: '#111827',
              border: '1px solid #E5E7EB',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'background 0.15s ease'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            {loading ? 'Analyzing Network...' : 'Refresh Network'}
          </button>
        </div>

        <GraphView nodes={graphData.nodes} edges={graphData.edges} />
      </div>
    </div>
  );
};

export default RelationshipExplorer;
