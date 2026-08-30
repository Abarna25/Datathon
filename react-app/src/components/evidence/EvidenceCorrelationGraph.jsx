import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Network, Maximize } from 'lucide-react';

const EvidenceCorrelationGraph = ({ correlations = [], evidence = [], caseId }) => {
  const fgRef = useRef();
  const [hoverNode, setHoverNode] = useState(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef();

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: 600
      });
      
      const handleResize = () => {
        if (containerRef.current) {
          setDimensions({
            width: containerRef.current.clientWidth,
            height: 600
          });
        }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const graphData = useMemo(() => {
    const nodes = [];
    const links = [];
    
    // 1. Add Central Case Node
    const caseNodeId = `CASE-${caseId}`;
    nodes.push({
      id: caseNodeId,
      name: `Case #${caseId}`,
      type: 'Case',
      val: 20,
      color: '#3b82f6'
    });

    // 2. Map unique evidence entities to Nodes
    const nodeMap = new Map();
    evidence.forEach(item => {
        const id = String(item.id);
        if (!nodeMap.has(id)) {
            let color = '#10b981'; // Green for generic evidence
            let type = 'Evidence';
            if (item.source === 'Accused') { color = '#ef4444'; type = 'Suspect'; }
            else if (item.source === 'Victim') { color = '#f59e0b'; type = 'Victim'; }
            else if (item.source === 'ArrestSurrender') { color = '#8b5cf6'; type = 'Arrest'; }
            else if (item.source === 'ActSectionAssociation') { color = '#06b6d4'; type = 'Legal'; }

            const node = {
                id,
                name: item.title || item.source || id,
                type,
                val: 10,
                color
            };
            nodeMap.set(id, node);
            nodes.push(node);

            // Connect Suspects, Victims, Legal directly to Case if they are root level
            if (['Suspect', 'Victim', 'Legal'].includes(type)) {
                links.push({
                    source: caseNodeId,
                    target: id,
                    label: `Has ${type}`
                });
            }
        }
    });

    // 3. Map Correlations to Links
    correlations.forEach(corr => {
        const src = String(corr.source || corr.source_evidence_id);
        const tgt = String(corr.target || corr.target_evidence_id);
        if (src && tgt && src !== tgt) {
            // Ensure nodes exist, if not create dummy ones
            if (!nodeMap.has(src)) {
                nodes.push({ id: src, name: src, type: 'Entity', val: 5, color: '#94a3b8' });
                nodeMap.set(src, true);
            }
            if (!nodeMap.has(tgt)) {
                nodes.push({ id: tgt, name: tgt, type: 'Entity', val: 5, color: '#94a3b8' });
                nodeMap.set(tgt, true);
            }
            links.push({
                source: src,
                target: tgt,
                label: corr.reason || corr.relationship_type || 'Linked',
                status: corr.status || 'EVIDENCE-BACKED',
                provenance: corr.provenance || 'Datastore',
                supporting_records: corr.supporting_records || []
            });
        }
    });

    return { nodes, links };
  }, [correlations, evidence, caseId]);

  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      fgRef.current.d3Force('charge').strength(-400);
      fgRef.current.d3Force('link').distance(80);
    }
  }, [graphData]);

  const updateHighlight = () => {
    setHighlightNodes(new Set(highlightNodes));
    setHighlightLinks(new Set(highlightLinks));
  };

  const handleNodeHover = node => {
    highlightNodes.clear();
    highlightLinks.clear();
    if (node) {
      highlightNodes.add(node);
      graphData.links.forEach(link => {
        if (link.source.id === node.id || link.target.id === node.id || link.source === node.id || link.target === node.id) {
          highlightLinks.add(link);
          highlightNodes.add(link.source);
          highlightNodes.add(link.target);
        }
      });
    }
    setHoverNode(node || null);
    updateHighlight();
  };

  const handleLinkHover = link => {
    highlightNodes.clear();
    highlightLinks.clear();
    if (link) {
      highlightLinks.add(link);
      highlightNodes.add(link.source);
      highlightNodes.add(link.target);
    }
    setHoverNode(null); // Clear node hover when hovering a link
    updateHighlight();
  };

  const paintNode = useCallback((node, ctx, globalScale) => {
    const isHighlight = highlightNodes.has(node);
    const isMuted = hoverNode && !isHighlight;

    const label = node.name.length > 25 ? node.name.substring(0, 25) + '...' : node.name;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;
    const textWidth = ctx.measureText(label).width;
    const bckgDimensions = [textWidth + (fontSize * 2), fontSize + (fontSize * 1.5)];
    
    ctx.fillStyle = isMuted ? 'rgba(255,255,255,0.05)' : (node.color || '#3b82f6');
    if (isHighlight) {
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 10;
    } else {
        ctx.shadowBlur = 0;
    }

    const x = node.x - bckgDimensions[0] / 2;
    const y = node.y - bckgDimensions[1] / 2;
    const r = 4 / globalScale;
    const w = bckgDimensions[0];
    const h = bckgDimensions[1];
    
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isMuted ? 'rgba(255,255,255,0.2)' : '#ffffff';
    ctx.fillText(label, node.x, node.y);
    
    const typeSize = 8 / globalScale;
    ctx.font = `bold ${typeSize}px Sans-Serif`;
    ctx.fillStyle = isMuted ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.9)';
    ctx.fillText(node.type.toUpperCase(), node.x, node.y - (bckgDimensions[1]/2) - (typeSize));
  }, [highlightNodes, hoverNode]);

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Network size={18} color="var(--accent-primary)" />
          Investigation Network DAG
        </h3>
        <button 
          onClick={() => fgRef.current?.zoomToFit(400, 50)}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
        >
          <Maximize size={14} /> Fit to Screen
        </button>
      </div>
      
      <div ref={containerRef} style={{ background: '#0f172a', borderRadius: '8px', overflow: 'hidden', height: '600px', width: '100%', position: 'relative' }}>
        
        {/* Legend Overlay */}
        <div style={{ position: 'absolute', bottom: '16px', left: '16px', zIndex: 10, background: 'rgba(15, 23, 42, 0.8)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Legend</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}><span style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '2px' }}></span> Case</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}><span style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '2px' }}></span> Suspect</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}><span style={{ width: '10px', height: '10px', background: '#f59e0b', borderRadius: '2px' }}></span> Victim</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}><span style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '2px' }}></span> Evidence</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}><span style={{ width: '10px', height: '10px', background: '#8b5cf6', borderRadius: '2px' }}></span> Arrest</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}><span style={{ width: '10px', height: '10px', background: '#06b6d4', borderRadius: '2px' }}></span> Legal</div>
        </div>

        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            dagMode="td"
            dagLevelDistance={60}
            backgroundColor="transparent"
            nodeRelSize={6}
            nodeCanvasObject={paintNode}
            nodeCanvasObjectMode={() => 'replace'}
            linkColor={link => highlightLinks.has(link) ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}
            linkWidth={link => highlightLinks.has(link) ? 2 : 1}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            onNodeHover={handleNodeHover}
            onLinkHover={handleLinkHover}
            linkLabel={(link) => {
              const records = link.supporting_records && link.supporting_records.length > 0 
                ? `<div style="color: #64748b; font-size: 10px; margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.1)">Supporting Records: ${link.supporting_records.join(', ')}</div>`
                : '';
              return `<div style="background: rgba(15,23,42,0.95); padding: 8px; border-radius: 4px; border: 1px solid #3b82f6; font-family: sans-serif; font-size: 12px; max-width: 250px; white-space: normal;">
                <div style="color: #3b82f6; font-weight: bold; margin-bottom: 4px;">${link.status}</div>
                <div style="color: #fff; margin-bottom: 4px;">${link.label}</div>
                <div style="color: #94a3b8; font-size: 10px;">Source: ${link.provenance}</div>
                ${records}
              </div>`;
            }}
            cooldownTicks={100}
            onEngineStop={() => fgRef.current.zoomToFit(400, 50)}
          />
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            No entities to display
          </div>
        )}
      </div>
    </div>
  );
};

export default EvidenceCorrelationGraph;
