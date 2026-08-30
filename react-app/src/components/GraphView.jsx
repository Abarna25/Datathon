import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
  Panel,
  useStore,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import { Network } from 'lucide-react';

// --- ENTERPRISE CONFIGURATION ---
const NODE_STYLE = {
    case: { color: '#2563EB', icon: '📁', label: 'CASE' }, // Blue
    suspect: { color: '#DC2626', icon: '🛑', label: 'SUSPECT' }, // Red
    victim: { color: '#16A34A', icon: '👤', label: 'VICTIM' }, // Green
    witness: { color: '#EA580C', icon: '👁️', label: 'WITNESS' }, // Orange
    officer: { color: '#4F46E5', icon: '👮', label: 'OFFICER' }, // Indigo
    police: { color: '#4F46E5', icon: '👮', label: 'OFFICER' },
    evidence: { color: '#9333EA', icon: '🧬', label: 'EVIDENCE' }, // Purple
    vehicle: { color: '#EAB308', icon: '🚗', label: 'VEHICLE' }, // Yellow
    phone: { color: '#06b6d4', icon: '📱', label: 'PHONE' },
    location: { color: '#92400e', icon: '📍', label: 'LOCATION' }, // Brown
    court: { color: '#4f46e5', icon: '🏛️', label: 'COURT' },
    analytical: { color: '#475569', icon: '🧠', label: 'AI ANALYSIS' },
    account: { color: '#10b981', icon: '💳', label: 'ACCOUNT' },
    organization: { color: '#6366f1', icon: '🏢', label: 'ORGANIZATION' },
    document: { color: '#8b5cf6', icon: '📄', label: 'DOCUMENT' },
    event: { color: '#f43f5e', icon: '⚡', label: 'EVENT' },
    default: { color: '#64748b', icon: '❓', label: 'ENTITY' }
};

// Directional configuration for IBM i2 style layout
const getDirectionalOffset = (type, index, count) => {
    const spacing = 180; // Distance between nodes in same group
    
    // Base coordinates for the group center
    let baseX = 0, baseY = 0;
    
    switch (type) {
        case 'case': return { x: 0, y: 0 };
        case 'suspect': 
            baseX = -500; baseY = 0; 
            break;
        case 'victim': 
            baseX = 500; baseY = 0; 
            break;
        case 'evidence':
        case 'weapon':
        case 'document':
            baseX = 0; baseY = -400; 
            break;
        case 'officer':
        case 'police':
            baseX = 0; baseY = 400; 
            break;
        case 'vehicle': 
            baseX = -400; baseY = 300; 
            break;
        case 'phone': 
            baseX = 400; baseY = 300; 
            break;
        case 'location': 
            baseX = 400; baseY = -300; 
            break;
        case 'witness':
            baseX = -400; baseY = -300;
            break;
        default: 
            baseX = 0; baseY = 500;
    }

    // Offset nodes within the group so they don't overlap
    const groupWidth = (count - 1) * spacing;
    const offsetX = baseX + (index * spacing) - (groupWidth / 2);
    
    // Slight arc or stagger to make it look organic
    const offsetY = baseY + (index % 2 === 0 ? 0 : 40);

    return { x: offsetX, y: offsetY };
};

const getDirectionalLayoutedElements = (nodes, edges) => {
    const layoutedNodes = [];
    
    // Group nodes by type
    const groups = {};
    nodes.forEach(node => {
        const t = node.data?.type || 'default';
        if (!groups[t]) groups[t] = [];
        groups[t].push(node);
    });

    // Place nodes directionally
    Object.keys(groups).forEach(type => {
        const groupNodes = groups[type];
        const count = groupNodes.length;

        groupNodes.forEach((node, i) => {
            node.position = getDirectionalOffset(type, i, count);
            
            // Centralize handles
            node.targetPosition = Position.Top;
            node.sourcePosition = Position.Bottom;
            
            layoutedNodes.push(node);
        });
    });

    return { nodes: layoutedNodes, edges };
};

const CustomInvestigationNode = ({ data, selected }) => {
    const zoom = useStore((s) => s.transform[2]);
    const showLabels = zoom > 0.8; // Lowered threshold slightly for better UX, but hides when zoomed far out
    const isFaded = data.isFaded;
    
    const style = NODE_STYLE[data.type] || NODE_STYLE.default;
    
    // When zoomed out, show just the glowing icon circle
    if (!showLabels) {
        return (
            <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: isFaded ? 'rgba(15,23,42,0.4)' : 'rgba(15,23,42,0.95)',
                border: `3px solid ${selected ? '#ffffff' : (isFaded ? 'rgba(255,255,255,0.1)' : style.color)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: (selected && !isFaded) ? `0 0 20px ${style.color}` : 'none',
                opacity: isFaded ? 0.3 : 1,
                transition: 'all 0.3s ease',
                color: '#fff', fontSize: '20px'
            }}>
                <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
                <span>{style.icon}</span>
                <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
            </div>
        );
    }

    // Full compact card
    return (
        <div style={{
            background: isFaded ? 'rgba(15,23,42,0.4)' : 'rgba(15,23,42,0.95)',
            border: `1px solid ${selected ? '#ffffff' : (isFaded ? 'rgba(255,255,255,0.1)' : style.color)}`,
            borderLeft: `6px solid ${selected ? '#ffffff' : style.color}`,
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: (selected && !isFaded) ? `0 0 25px ${style.color}80` : '0 4px 12px rgba(0,0,0,0.5)',
            opacity: isFaded ? 0.3 : 1,
            transition: 'all 0.3s ease',
            color: '#fff',
            width: '200px',
            backdropFilter: 'blur(8px)',
        }}>
            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
            <div style={{ 
                width: 32, height: 32, borderRadius: '50%', background: `${style.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${style.color}`,
                flexShrink: 0
            }}>
                <span style={{ fontSize: '16px' }}>{style.icon}</span>
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontWeight: selected ? 700 : 600, fontSize: '12px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {data.label}
                </div>
                <div style={{ fontSize: '9px', color: style.color, textTransform: 'uppercase', marginTop: '2px', letterSpacing: '0.5px', fontWeight: 'bold' }}>
                    {style.label}
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
        </div>
    );
};

const nodeTypes = {
    investigationNode: CustomInvestigationNode,
};

const GraphViewInner = ({ nodes = [], edges = [], searchQuery = '', onNodeSelect, onEdgeSelect }) => {
    const [rfNodes, setNodes, onNodesChange] = useNodesState([]);
    const [rfEdges, setEdges, onEdgesChange] = useEdgesState([]);
    const { fitView, setCenter } = useReactFlow();
    
    useEffect(() => {
        // Center node anchoring (offset by half width/height so 0,0 is true center)
        const initialNodes = nodes.map(n => ({
            id: n.id,
            type: 'investigationNode',
            data: { ...n, isFaded: false },
            position: { x: 0, y: 0 }
        }));

        const initialEdges = edges.map(e => {
            const src = e.source.id || e.source;
            const tgt = e.target.id || e.target;
            const label = e.label || 'LINKED';
            const color = '#94a3b8'; // Neutral edge until highlighted
            return {
                id: `e-${src}-${tgt}`,
                source: src,
                target: tgt,
                label: label,
                data: { supportingEvidence: e.supportingEvidence },
                type: 'bezier', // Smooth curved edges
                animated: false,
                style: { stroke: 'rgba(148, 163, 184, 0.4)', strokeWidth: 1.5, opacity: 1 },
                labelStyle: { fill: '#fff', fontWeight: 600, fontSize: 10 },
                labelBgStyle: { fill: 'rgba(15,23,42,0.9)', color: '#fff', rx: 4, ry: 4 },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 12,
                    height: 12,
                    color: 'rgba(148, 163, 184, 0.4)',
                },
            };
        });

        // Compute Directional Layout
        if (initialNodes.length > 0) {
            const { nodes: layoutedNodes, edges: layoutedEdges } = getDirectionalLayoutedElements(initialNodes, initialEdges);
            setNodes(layoutedNodes);
            setEdges(layoutedEdges);
            
            // Auto fit after layout
            setTimeout(() => {
                fitView({ padding: 0.2, duration: 800 });
            }, 100);
        } else {
            setNodes([]);
            setEdges([]);
        }
        
    }, [nodes, edges, setNodes, setEdges, fitView]);
    
    // Path calculation
    const getConnectedPath = useCallback((nodeId) => {
        if (!nodeId) return { nodes: new Set(), edges: new Set() };
        
        const pathNodes = new Set([nodeId]);
        const pathEdges = new Set();
        
        let changed = true;
        while (changed) {
            changed = false;
            rfEdges.forEach(e => {
                if (pathNodes.has(e.source) && !pathNodes.has(e.target)) {
                    pathNodes.add(e.target);
                    pathEdges.add(e.id);
                    changed = true;
                }
                if (pathNodes.has(e.target) && !pathNodes.has(e.source)) {
                    pathNodes.add(e.source);
                    pathEdges.add(e.id);
                    changed = true;
                }
                if (pathNodes.has(e.source) && pathNodes.has(e.target)) {
                    pathEdges.add(e.id);
                }
            });
        }
        
        return { nodes: pathNodes, edges: pathEdges };
    }, [rfEdges]);

    const handleNodeDoubleClick = useCallback((event, node) => {
        setCenter(node.position.x, node.position.y, { zoom: 1.2, duration: 800 });
    }, [setCenter]);

    const onNodeClick = useCallback((event, node) => {
        if (onNodeSelect) {
            const originalNode = nodes.find(n => n.id === node.id) || node.data;
            onNodeSelect(originalNode);
        }
        
        const path = getConnectedPath(node.id);
        
        // Update nodes and edges style
        setNodes(nds => nds.map(n => {
            n.data = { ...n.data, isFaded: !path.nodes.has(n.id) };
            return n;
        }));
        
        setEdges(eds => eds.map(e => {
            const isPath = path.edges.has(e.id);
            // Derive color from source node for highlighted path
            const srcNode = rfNodes.find(n => n.id === e.source);
            const styleDef = NODE_STYLE[srcNode?.data?.type] || NODE_STYLE.default;
            const activeColor = styleDef.color;

            e.style = { 
                ...e.style, 
                opacity: isPath ? 1 : 0.05, 
                stroke: isPath ? activeColor : 'rgba(148, 163, 184, 0.4)', 
                strokeWidth: isPath ? 3 : 1.5 
            };
            e.markerEnd = { 
                ...e.markerEnd, 
                color: isPath ? activeColor : 'rgba(148, 163, 184, 0.4)' 
            };
            e.animated = isPath;
            return e;
        }));
        
    }, [nodes, rfNodes, getConnectedPath, onNodeSelect, setNodes, setEdges]);
    
    const onEdgeClick = useCallback((event, edge) => {
        if (onEdgeSelect) {
            onEdgeSelect(edge);
        }
    }, [onEdgeSelect]);
    
    const onPaneClick = useCallback(() => {
        if (onNodeSelect) onNodeSelect(null);
        if (onEdgeSelect) onEdgeSelect(null);
        
        setNodes(nds => nds.map(n => {
            n.data = { ...n.data, isFaded: false };
            return n;
        }));
        
        setEdges(eds => eds.map(e => {
            e.style = { ...e.style, opacity: 1, stroke: 'rgba(148, 163, 184, 0.4)', strokeWidth: 1.5 };
            e.markerEnd = { ...e.markerEnd, color: 'rgba(148, 163, 184, 0.4)' };
            e.animated = false;
            return e;
        }));
    }, [onNodeSelect, setNodes, setEdges]);
    
    // Search
    useEffect(() => {
        if (!searchQuery) return;
        const query = searchQuery.toLowerCase();
        const found = rfNodes.find(n => n.data.label?.toLowerCase().includes(query) || n.id?.toLowerCase().includes(query));
        if (found) {
            onNodeClick(null, found);
            setCenter(found.position.x, found.position.y, { zoom: 1.5, duration: 800 });
        }
    }, [searchQuery, rfNodes, onNodeClick, setCenter]);

    // Decorative Concentric Rings Background
    const renderConcentricRings = () => {
        return [280, 540, 800, 1060].map((radius, idx) => (
            <div key={idx} style={{
                position: 'absolute',
                top: `calc(50% - ${radius}px)`,
                left: `calc(50% - ${radius}px)`,
                width: `${radius * 2}px`,
                height: `${radius * 2}px`,
                borderRadius: '50%',
                border: '1px dashed rgba(255,255,255,0.03)',
                pointerEvents: 'none',
                zIndex: -1,
                boxShadow: 'inset 0 0 100px rgba(0,0,0,0.2)'
            }} />
        ));
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#07111f', overflow: 'hidden', animation: 'fadeIn 1s ease-out' }}>
            {/* Subtle blueprint grid glow */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(37,99,235,0.05) 0%, rgba(7,17,31,1) 100%)', pointerEvents: 'none', zIndex: 0 }} />
            <style>{`
                @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            `}</style>
            
            <ReactFlow
                nodes={rfNodes}
                edges={rfEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                minZoom={0.05}
                maxZoom={2.5}
                defaultEdgeOptions={{ zIndex: 0 }}
                fitView
            >
                <Background color="rgba(255,255,255,0.15)" gap={40} size={1} variant="lines" style={{ opacity: 0.15 }} />
                <Controls style={{ 
                    background: 'rgba(15,23,42,0.85)', 
                    padding: '6px', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    backdropFilter: 'blur(8px)', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', 
                    fill: '#fff' 
                }} />
                
                <MiniMap 
                    nodeColor={(n) => NODE_STYLE[n.data?.type]?.color || '#64748b'}
                    maskColor="rgba(7, 17, 31, 0.7)"
                    style={{ background: 'rgba(15,23,42,0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', right: 16, bottom: 16 }}
                />

                <Panel position="bottom-left" style={{ background: '#FFFFFF', padding: '16px', borderRadius: '16px', border: '1px solid #CBD5E1', boxShadow: '0 12px 32px rgba(0,0,0,0.15)', backdropFilter: 'blur(8px)', margin: '16px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Entity Legend</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                        {Object.entries(NODE_STYLE).filter(([k]) => k !== 'default' && k !== 'police').map(([key, style]) => (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#0F172A', fontWeight: '600' }}>
                                <div style={{ width: 14, height: 14, borderRadius: '4px', background: style.color, boxShadow: `0 0 10px ${style.color}40` }} />
                                <span>{style.label}</span>
                            </div>
                        ))}
                    </div>
                </Panel>
            </ReactFlow>
        </div>
    );
};

const GraphView = (props) => (
    <ReactFlowProvider>
        <GraphViewInner {...props} />
    </ReactFlowProvider>
);

export default GraphView;
