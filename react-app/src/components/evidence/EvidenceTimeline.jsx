import React, { useState } from 'react';
import { Clock, Filter, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EvidenceTimeline = ({ evidence }) => {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [hoveredEvent, setHoveredEvent] = useState(null);

  const timelineData = evidence || [];

  const filters = ['ALL', 'INCIDENT', 'TESTIMONY', 'EVIDENCE', 'ACTION'];

  const filteredTimeline = timelineData.filter(e => activeFilter === 'ALL' || e.type === activeFilter)
                                       .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="var(--accent-primary)" />
            Interactive Investigation Timeline
        </h3>
        
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <Filter size={14} color="var(--text-secondary)" style={{ margin: '4px' }} />
            {filters.map(f => (
                <button 
                    key={f} onClick={() => setActiveFilter(f)}
                    style={{ 
                        padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer',
                        background: activeFilter === f ? 'var(--accent-primary)' : 'transparent',
                        color: activeFilter === f ? '#fff' : 'var(--text-secondary)'
                    }}
                >{f}</button>
            ))}
        </div>
      </div>

      <div style={{ position: 'relative', height: '180px', display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: '20px', scrollbarWidth: 'thin' }}>
        {filteredTimeline.length === 0 ? (
            <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', paddingTop: '40px' }}>
                <AlertTriangle size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <div>No timeline events recorded in the database.</div>
            </div>
        ) : (
            <>
                {/* Horizontal Line */}
                <div style={{ position: 'absolute', top: '50%', left: '20px', right: '20px', height: '4px', background: 'var(--glass-border)', borderRadius: '2px', zIndex: 0 }} />

                {filteredTimeline.map((item, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        style={{ 
                            position: 'relative', minWidth: '160px', height: '100%', 
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end',
                            zIndex: 1
                        }}
                        onMouseEnter={() => setHoveredEvent(i)}
                        onMouseLeave={() => setHoveredEvent(null)}
                    >
                        {i % 2 === 0 && (
                            <div style={{ textAlign: 'center', padding: '0 10px', marginTop: '10px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{item.title}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{new Date(item.date).toLocaleDateString()}</div>
                            </div>
                        )}
                        
                        {/* Connector Line */}
                        <div style={{ width: '2px', height: '30px', background: item.color || 'var(--accent-primary)', margin: '8px 0' }} />
                        
                        {/* Node */}
                        <div style={{ 
                            width: '16px', height: '16px', borderRadius: '50%', 
                            background: item.color || 'var(--accent-primary)', border: '3px solid var(--bg-primary)',
                            boxShadow: hoveredEvent === i ? `0 0 15px ${item.color || 'var(--accent-primary)'}` : 'none',
                            transition: 'all 0.2s', cursor: 'pointer', transform: hoveredEvent === i ? 'scale(1.5)' : 'scale(1)'
                        }} />

                        {/* Connector Line */}
                        <div style={{ width: '2px', height: '30px', background: item.color || 'var(--accent-primary)', margin: '8px 0' }} />

                        {i % 2 !== 0 && (
                            <div style={{ textAlign: 'center', padding: '0 10px', marginBottom: '10px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{item.title}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{new Date(item.date).toLocaleDateString()}</div>
                            </div>
                        )}

                        {/* Hover Card */}
                        <AnimatePresence>
                            {hoveredEvent === i && (
                                <motion.div 
                                    initial={{ opacity: 0, y: i % 2 === 0 ? 10 : -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        position: 'absolute', top: i % 2 === 0 ? '70%' : '10%',
                                        background: 'rgba(15,23,42,0.95)', border: `1px solid ${item.color || 'var(--accent-primary)'}`,
                                        padding: '12px', borderRadius: '8px', zIndex: 50, minWidth: '180px', pointerEvents: 'none',
                                        backdropFilter: 'blur(8px)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                                    }}
                                >
                                    <div style={{ fontSize: '10px', color: item.color, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>{item.type}</div>
                                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>{item.title}</div>
                                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '8px' }}>{new Date(item.date).toLocaleString()}</div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.description}</div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </motion.div>
                ))}
            </>
        )}
      </div>
    </div>
  );
};

export default EvidenceTimeline;
