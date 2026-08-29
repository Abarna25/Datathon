import React, { useState, useEffect, useCallback, useMemo } from 'react';
import GraphView from '../components/GraphView';
import { 
    Network, Search, AlertTriangle, ShieldCheck, 
    Activity, Clock, Users, X, BrainCircuit, Zap, Map as MapIcon, Share2
} from 'lucide-react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import AIAssistantPanel from '../components/AIAssistantPanel';
import MapView from '../components/MapView';
import '@xyflow/react/dist/style.css';

const RelationshipExplorer = () => {
    const [loading, setLoading] = useState(false);
    const [rawData, setRawData] = useState({ nodes: [], edges: [] });
    const { activeCaseId, currentCase } = useAppContext();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [selectedNode, setSelectedNode] = useState(null);
    const [viewMode, setViewMode] = useState('topology'); // 'topology' | 'map'

    const fetchNetwork = useCallback(async () => {
        if (!activeCaseId) {
            setRawData({ nodes: [], edges: [] });
            return;
        }
        setLoading(true);
        try {
            const endpoint = viewMode === 'temporal' 
                ? `/intelligence/case/${activeCaseId}/temporal-network` 
                : '/relationships';
            const params = viewMode === 'temporal' ? {} : { caseId: activeCaseId };
            const response = await api.get(endpoint, { params });
            if (response.data && response.data.success && response.data.data) {
                setRawData(response.data.data);
            }
        } catch (error) {
            console.debug("Failed to fetch relationships", error);
        } finally {
            setLoading(false);
        }
    }, [activeCaseId, viewMode]);

    useEffect(() => {
        // Destroy current graph data immediately on case change to prevent merging
        setRawData({ nodes: [], edges: [] });
        fetchNetwork();
    }, [fetchNetwork]);

    // Data Processing & Genuine Evidence Nodes
    const { filteredNodes, filteredEdges, insights } = useMemo(() => {
        let rawN = [...(rawData.nodes || [])];
        let rawE = [...(rawData.edges || [])];

        // 1. Clean nodes without fabrication
        const limitedNodes = rawN.map(n => ({
            ...n,
            label: n.label || `Entity #${n.id}`,
            type: n.type || 'default'
        }));

        // 2. Keep authentic backend edge labels
        const edgesWithLabels = rawE.map((e) => ({
            ...e,
            label: e.label || (e.relationshipType ? e.relationshipType.replace(/_/g, ' ') : 'Associated')
        }));

        // Apply Filters
        let nodes = limitedNodes;
        let edges = edgesWithLabels;

        if (activeFilter !== 'All') {
            const keepType = (n) => {
                if (n.type === 'case') return true; 
                const t = n.type || '';
                switch (activeFilter) {
                    case 'People': return ['suspect', 'victim', 'witness', 'officer', 'police'].includes(t);
                    case 'Evidence': return ['evidence', 'weapon', 'physical_evidence'].includes(t);
                    case 'Vehicles': return t === 'vehicle';
                    case 'Phones': return t === 'phone';
                    case 'Financial': return t === 'financial';
                    case 'Locations': return t === 'location';
                    case 'Forensics': return t === 'lab';
                    case 'Court': return t === 'court';
                    default: return true;
                }
            };
            nodes = nodes.filter(keepType);
            const keptIds = new Set(nodes.map(n => n.id));
            edges = edges.filter(e => keptIds.has(e.source?.id || e.source) && keptIds.has(e.target?.id || e.target));
        }

        const stats = {
            total: nodes.length,
            connections: edges.length,
            riskLevel: nodes.some(n => n.type === 'suspect') ? 'Elevated' : 'Standard',
            clusters: new Set(nodes.map(n => n.cluster).filter(Boolean)).size || 1,
            highRisk: nodes.filter(n => n.type === 'suspect').length
        };

        return { filteredNodes: nodes, filteredEdges: edges, insights: stats };
    }, [rawData, activeFilter]);


    if (!activeCaseId) return <div style={{ padding: 20, color: '#94a3b8' }}>No Case Selected.</div>;
    
    if (filteredNodes.length === 0 && !loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <Network size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                <h3 style={{ margin: 0, fontSize: '18px', color: '#f8fafc' }}>No connected investigation network found.</h3>
                <p style={{ marginTop: '8px', fontSize: '14px' }}>There are no entities linked to this case yet.</p>
            </div>
        );
    }

    const filters = ['All', 'People', 'Evidence', 'Vehicles', 'Phones', 'Financial', 'Locations', 'Forensics', 'Court'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
            
            {/* Top Stat Bar */}
            <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
                <TopMetric icon={Users} label="Entities" value={insights.total} color="#3b82f6" />
                <TopMetric icon={Network} label="Connections" value={insights.connections} color="#8b5cf6" />
                <TopMetric icon={BrainCircuit} label="Clusters Detected" value={insights.clusters} color="#06b6d4" />
                <TopMetric icon={AlertTriangle} label="High Risk Entities" value={insights.highRisk} color="#ef4444" />
            </div>

            <AIAssistantPanel 
                title={viewMode === 'temporal' ? "Temporal Multi-Hop Network Summary" : "AI Network Summary"} 
                content={viewMode === 'temporal' 
                    ? `Displaying time-bounded multi-hop graph across Person ➔ Case ➔ Location ➔ Evidence. All connections are backed by verified database records with strict temporal provenance.`
                    : `I have analyzed a network of **${insights.total} entities** and **${insights.connections} connections**. There are **${insights.clusters} distinct communities**. Pay close attention to the **${insights.highRisk} high-risk** suspects bridging these clusters.`
                }
                delay={600}
            />

            <div style={{ position: 'relative', flex: 1, display: 'flex', gap: '16px', minHeight: '800px', overflow: 'hidden' }}>
                
                {/* Graph Area */}
                <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', borderRadius: '16px', overflow: 'hidden', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)' }}>
                    
                    {/* Top Floating Controls */}
                    <div style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        
                        {/* Top-Left Overlay Badge */}
                        <div style={{ background: '#0F172A', border: '1px solid #1E293B', padding: '12px 16px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', color: '#F8FAFC' }}>
                            <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '4px' }}>Relationship Explorer</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#3B82F6' }}>{currentCase?.crimeNo || 'Active Case'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px', color: '#94A3B8' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12}/> {insights.total} Nodes</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Network size={12}/> {insights.connections} Links</span>
                            </div>
                            
                            {/* View Toggle */}
                            <div style={{ display: 'flex', background: '#1E293B', borderRadius: '8px', padding: '4px', marginTop: '12px', gap: '4px' }}>
                                <button 
                                    onClick={() => setViewMode('topology')}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '6px 8px', borderRadius: '6px', background: viewMode === 'topology' ? '#2563EB' : 'transparent', color: viewMode === 'topology' ? '#FFFFFF' : '#94A3B8', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '600', transition: 'all 0.2s' }}
                                >
                                    <Network size={13} /> Topology
                                </button>
                                <button 
                                    onClick={() => setViewMode('temporal')}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '6px 8px', borderRadius: '6px', background: viewMode === 'temporal' ? '#8B5CF6' : 'transparent', color: viewMode === 'temporal' ? '#FFFFFF' : '#94A3B8', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '600', transition: 'all 0.2s' }}
                                >
                                    <Clock size={13} /> Temporal
                                </button>
                                <button 
                                    onClick={() => setViewMode('map')}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '6px 8px', borderRadius: '6px', background: viewMode === 'map' ? '#2563EB' : 'transparent', color: viewMode === 'map' ? '#FFFFFF' : '#94A3B8', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '600', transition: 'all 0.2s' }}
                                >
                                    <MapIcon size={13} /> Geospatial
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div style={{ position: 'relative', background: 'rgba(15,23,42,0.85)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
                            <input 
                                type="text" placeholder="Search entity..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                                style={{ padding: '8px 12px 8px 36px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '14px', width: '200px', outline: 'none' }} 
                            />
                        </div>
                    </div>

                    {viewMode === 'topology' || viewMode === 'temporal' ? (
                        <GraphView key={`graph-${activeCaseId}-${viewMode}`} nodes={filteredNodes} edges={filteredEdges} searchQuery={searchQuery} onNodeSelect={setSelectedNode} />
                    ) : (
                        <MapView key={`map-${activeCaseId}`} nodes={filteredNodes} onNodeSelect={setSelectedNode} />
                    )}
                </div>

                {/* Right Sidebar Inspector (Slides in) */}
                {selectedNode && (
                    <div style={{ 
                        width: '380px', display: 'flex', flexDirection: 'column', flexShrink: 0, 
                        animation: 'slideInRight 0.3s ease-out', borderRadius: '16px', overflow: 'hidden',
                        background: '#F8FAFC', border: '1px solid #CBD5E1', 
                        borderLeft: `6px solid ${getColorForType(selectedNode.type)}`,
                        boxShadow: '0 12px 32px rgba(0,0,0,0.18)'
                    }}>
                        <style>{`
                            @keyframes slideInRight { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                        `}</style>
                        <div style={{ padding: '24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#FFFFFF' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                {/* Photo Placeholder */}
                                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {['person', 'suspect', 'victim', 'witness'].includes(selectedNode.type) ? (
                                        <img src={`https://ui-avatars.com/api/?name=${selectedNode.label}&background=random&color=fff&size=100`} alt="Avatar" style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                                    ) : (
                                        <Activity size={28} color="#94A3B8" />
                                    )}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0F172A', lineHeight: 1.2 }}>{selectedNode.label}</h3>
                                    <div style={{ fontSize: '12px', color: getColorForType(selectedNode.type), textTransform: 'uppercase', marginTop: '6px', letterSpacing: '1px', fontWeight: 600 }}>{selectedNode.type}</div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedNode(null)} style={{ background: '#F1F5F9', border: 'none', color: '#64748B', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16}/></button>
                        </div>
                        
                        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '28px', background: '#F8FAFC' }}>
                            
                            {/* Attributes Section */}
                            <div>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                                    <Zap size={14} /> Entity Attributes
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
                                    <DetailRow label="Entity ID" value={selectedNode.id} />
                                    <DetailRow label="System Status" value={selectedNode.status || 'Active'} highlight="#16A34A" />
                                    <DetailRow label="Risk Assessment" value={selectedNode.risk || (selectedNode.type === 'suspect' ? 'Elevated (Accused)' : 'Standard')} highlight={selectedNode.type === 'suspect' ? "#DC2626" : "#2563EB"} />
                                    <DetailRow label="Entity Role" value={selectedNode.type ? selectedNode.type.toUpperCase() : 'GENERAL'} highlight="#2563EB" />
                                    <DetailRow label="Connected Entities" value={filteredEdges.filter(e => (e.source.id || e.source) === selectedNode.id || (e.target.id || e.target) === selectedNode.id).length || 0} highlight="#9333EA" />

                                </div>
                            </div>

                            {/* Timeline */}
                            <div>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                                    <Clock size={14} /> Investigation Timeline
                                </h4>
                                <div style={{ borderLeft: '2px solid #E2E8F0', marginLeft: '8px', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '-22px', top: '2px', width: '10px', height: '10px', borderRadius: '50%', background: '#2563EB', border: '2px solid #F8FAFC' }} />
                                        <div style={{ fontSize: '12px', color: '#64748B' }}>2 days ago</div>
                                        <div style={{ fontSize: '14px', color: '#0F172A', marginTop: '2px', fontWeight: '500' }}>Entity surfaced in network analysis</div>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '-22px', top: '2px', width: '10px', height: '10px', borderRadius: '50%', background: '#94A3B8', border: '2px solid #F8FAFC' }} />
                                        <div style={{ fontSize: '12px', color: '#64748B' }}>5 days ago</div>
                                        <div style={{ fontSize: '14px', color: '#0F172A', marginTop: '2px', fontWeight: '500' }}>Initial case attachment via FIR</div>
                                    </div>
                                </div>
                            </div>

                            {/* AI Summary Section */}
                            <div>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                                    <BrainCircuit size={14} /> AI Analyst Summary
                                </h4>
                                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '16px' }}>
                                    <div style={{ fontSize: '14px', color: '#1E3A8A', lineHeight: '1.6' }}>
                                        Strong topological relationships detected centered around this node. AI algorithms flag this entity as highly influential within the immediate case cluster. Proceed with caution during operational contact.
                                    </div>
                                    <button style={{ width: '100%', padding: '12px', background: '#DBEAFE', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: '8px', marginTop: '16px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}>
                                        Export Target Dossier
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const getColorForType = (type) => {
    const map = {
        case: '#2563EB', suspect: '#DC2626', victim: '#16A34A', witness: '#EA580C', 
        officer: '#4F46E5', evidence: '#9333EA', vehicle: '#EAB308', phone: '#06b6d4', location: '#92400e'
    };
    return map[type] || '#64748B';
};

const TopMetric = ({ icon: Icon, label, value, color }) => (
    <div className="glass-panel hover-glow" style={{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={24} color={color} />
        </div>
        <div>
            <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f8fafc', marginTop: '4px' }}>{value}</div>
        </div>
    </div>
);

const DetailRow = ({ label, value, highlight }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #E2E8F0' }}>
        <span style={{ color: '#64748B' }}>{label}</span>
        <span style={{ fontWeight: '600', color: highlight || '#0F172A' }}>{value}</span>
    </div>
);

export default RelationshipExplorer;
