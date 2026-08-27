import React, { useEffect, useRef, useState, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const EntityGraph = ({ relationships, aliases }) => {
  const containerRef = useRef(null);
  const fgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight || 600
      });
    }
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight || 600
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();

    const addNode = (id, type) => {
      if (!nodeMap.has(id)) {
        const node = { 
          id, 
          label: id, 
          type, 
          val: type === 'Person' ? 20 : (type === 'Vehicle' ? 15 : 10),
          color: type === 'Person' ? '#3b82f6' : (type === 'Vehicle' ? '#ef4444' : '#10b981')
        };
        nodes.push(node);
        nodeMap.set(id, node);
      }
    };

    if (relationships && relationships.length > 0) {
      relationships.forEach(rel => {
        const src = rel.source_entity.replace(/["\\]/g, '');
        const tgt = rel.target_entity.replace(/["\\]/g, '');
        const rType = rel.relationship_type.replace(/["\\]/g, '');
        
        // Infer type heuristically for demo
        const srcType = src.match(/^[A-Z]{2}[0-9]{2}/) ? 'Vehicle' : (src.match(/^[0-9]{10}/) ? 'Phone' : 'Person');
        const tgtType = tgt.match(/^[A-Z]{2}[0-9]{2}/) ? 'Vehicle' : (tgt.match(/^[0-9]{10}/) ? 'Phone' : 'Person');
        
        addNode(src, srcType);
        addNode(tgt, tgtType);

        links.push({
          source: src,
          target: tgt,
          label: rType,
          color: 'rgba(255,255,255,0.2)'
        });
      });
    }

    if (aliases && aliases.length > 0) {
      aliases.forEach(al => {
        const prim = al.primary_name.replace(/["\\]/g, '');
        const alias = al.alias_name.replace(/["\\]/g, '');
        
        addNode(prim, 'Person');
        addNode(alias, 'Alias');

        links.push({
          source: alias,
          target: prim,
          label: 'Alias of',
          color: 'rgba(239,68,68,0.5)',
          lineDash: [2, 2]
        });
      });
    }

    // Removed heuristic demo graph expansion
    setGraphData({ nodes, links });
  }, [relationships, aliases]);

  // Adjust d3-force parameters to prevent overlap and make graph clear
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-500); // Strong repulsion
      fgRef.current.d3Force('link').distance(120);    // Longer links
      fgRef.current.d3Force('center').strength(0.05); // Keep centered loosely
    }
  }, [graphData]);

  return (
    <div className="glass-panel" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', height: '600px' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)' }}>
        <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: 0 }}>Advanced Entity Relationship Explorer</h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Maltego-style neural visualization</p>
      </div>
      
      <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {graphData.nodes.length === 0 ? (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            No entity relationships extracted for this case.
          </div>
        ) : (
          <>
            <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="label"
          nodeColor="color"
          nodeRelSize={1}
          linkColor="color"
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          linkCurvature={0.25}
          linkLineDash={d => d.lineDash}
          linkCanvasObjectMode={() => 'after'}
          linkCanvasObject={(link, ctx) => {
            const MAX_FONT_SIZE = 4;
            const LABEL_NODE_MARGIN = dimensions.width * 1.5;

            const start = link.source;
            const end = link.target;

            // ignore unbound links
            if (typeof start !== 'object' || typeof end !== 'object') return;

            const textPos = Object.assign(...['x', 'y'].map(c => ({
              [c]: start[c] + (end[c] - start[c]) / 2
            })));

            const relLink = { x: end.x - start.x, y: end.y - start.y };
            let textAngle = Math.atan2(relLink.y, relLink.x);
            if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle);
            if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle);

            const label = link.label;

            ctx.font = `${MAX_FONT_SIZE}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, MAX_FONT_SIZE].map(n => n + MAX_FONT_SIZE * 0.2);

            ctx.save();
            ctx.translate(textPos.x, textPos.y);
            ctx.rotate(textAngle);

            ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
            ctx.fillRect(-bckgDimensions[0] / 2, -bckgDimensions[1] / 2, ...bckgDimensions);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(label, 0, 0);
            ctx.restore();
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.label;
            const fontSize = 12/globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            
            // Draw Node Circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color;
            ctx.fill();
            ctx.shadowColor = node.color;
            ctx.shadowBlur = 10;
            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.lineWidth = 1/globalScale;
            ctx.stroke();
            
            // Draw Label
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

            ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + node.val + 2 - bckgDimensions[1] / 2, ...bckgDimensions);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#e2e8f0';
            ctx.fillText(label, node.x, node.y + node.val + 2);
          }}
        />
        
        {/* Graph Legend Overlay */}
        <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(15,23,42,0.8)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#e2e8f0' }}>Entity Legend</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }}/> Person / Suspect</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}/> Vehicle</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }}/> Phone / Comms</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }}/> Alias</div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default EntityGraph;
