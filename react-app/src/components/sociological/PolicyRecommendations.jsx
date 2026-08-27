import React, { useState, useEffect } from 'react';
import {
    Lightbulb, MapPin, BarChart2, Target, CheckCircle2,
    Clock, XCircle, AlertTriangle, ChevronDown, ChevronUp,
    TrendingUp, TrendingDown, Filter, Search, ArrowUpRight,
    Briefcase, BookOpen, Home, HeartPulse, Users, Shield,
    Loader2
} from 'lucide-react';

import api from '../../services/api';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const PRIORITY_CFG = {
    CRITICAL: { label: 'Critical',     color: '#dc2626', bg: 'rgba(220,38,38,0.12)',   border: 'rgba(220,38,38,0.3)'  },
    HIGH:     { label: 'High',         color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.25)' },
    MEDIUM:   { label: 'Medium',       color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.25)'},
    LOW:      { label: 'Low',          color: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)'},
};

const STATUS_CFG = {
    DRAFT:        { label: 'Draft',        color: '#6b7280', bg: 'rgba(107,114,128,0.1)', Icon: Clock       },
    APPROVED:     { label: 'Approved',     color: '#10b981', bg: 'rgba(16,185,129,0.1)', Icon: CheckCircle2 },
    IN_PROGRESS:  { label: 'In Progress',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', Icon: Loader2      },
    UNDER_REVIEW: { label: 'Under Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', Icon: AlertTriangle},
    COMPLETED:    { label: 'Completed',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', Icon: CheckCircle2 },
    REJECTED:     { label: 'Rejected',     color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  Icon: XCircle      },
};

const CONFIDENCE_CFG = {
    HIGH:   { color: '#10b981' },
    MEDIUM: { color: '#f59e0b' },
    LOW:    { color: '#6b7280' },
};

const CATEGORY_ICONS = {
    Economic:  <Briefcase size={14} />,
    Social:    <Users     size={14} />,
    Education: <BookOpen  size={14} />,
    Justice:   <Shield    size={14} />,
    Housing:   <Home      size={14} />,
    Health:    <HeartPulse size={14} />,
};

const ALL_PRIORITIES = ['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const ALL_STATUSES   = ['All', 'DRAFT', 'APPROVED', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'REJECTED'];
const ALL_CATEGORIES = ['All', 'Economic', 'Social', 'Education', 'Justice', 'Housing', 'Health'];

// ─── REUSABLE BADGE COMPONENTS ───────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
    const cfg = PRIORITY_CFG[priority] || PRIORITY_CFG.LOW;
    return (
        <span style={{
            padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
            letterSpacing: '0.5px', color: cfg.color,
            background: cfg.bg, border: `1px solid ${cfg.border}`
        }}>
            {cfg.label}
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CFG[status] || STATUS_CFG.DRAFT;
    const { Icon } = cfg;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
            color: cfg.color, background: cfg.bg
        }}>
            <Icon size={11} /> {cfg.label}
        </span>
    );
};

const ConfidencePip = ({ level }) => {
    const cfg = CONFIDENCE_CFG[level] || CONFIDENCE_CFG.LOW;
    return (
        <span style={{ fontSize: '12px', fontWeight: '700', color: cfg.color }}>
            {level} confidence
        </span>
    );
};

// ─── SUPPORTING DATA ROW ─────────────────────────────────────────────────────
const SupportingDataRow = ({ item }) => (
    <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 12px', borderRadius: '8px',
        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)'
    }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.value}</span>
            {item.delta && (
                <span style={{
                    fontSize: '11px', fontWeight: '600',
                    color: item.worse ? '#ef4444' : '#10b981',
                    display: 'flex', alignItems: 'center', gap: '2px'
                }}>
                    {item.worse ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {item.delta}
                </span>
            )}
        </div>
    </div>
);

// ─── RECOMMENDATION CARD ─────────────────────────────────────────────────────
const RecommendationCard = ({ rec }) => {
    const [expanded, setExpanded] = useState(false);
    const priorityCfg = PRIORITY_CFG[rec.priority] || PRIORITY_CFG.LOW;

    return (
        <div style={{
            borderRadius: '12px', overflow: 'hidden',
            background: 'var(--bg-secondary)',
            border: `1px solid ${expanded ? priorityCfg.border : 'var(--border-color)'}`,
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: expanded ? `0 4px 24px ${priorityCfg.color}15` : 'none'
        }}>
            {/* Priority accent stripe */}
            <div style={{ height: '3px', background: priorityCfg.color }} />

            {/* Card Header — always visible */}
            <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{rec.id}</span>
                            <PriorityBadge priority={rec.priority} />
                            <StatusBadge status={rec.status} />
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '3px 8px', borderRadius: '12px', fontSize: '11px',
                                background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)'
                            }}>
                                {CATEGORY_ICONS[rec.category]} {rec.category}
                            </span>
                        </div>
                        <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                            {rec.title}
                        </h3>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5',
                            display: '-webkit-box', WebkitLineClamp: expanded ? 'none' : 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                            {rec.description}
                        </p>
                    </div>

                    {/* Impact Summary — top-right */}
                    <div style={{
                        flexShrink: 0, textAlign: 'center', padding: '12px 16px',
                        background: 'rgba(16,185,129,0.08)', borderRadius: '10px',
                        border: '1px solid rgba(16,185,129,0.2)'
                    }}>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#10b981' }}>
                            ↓{rec.expectedImpact.crimeReduction}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>
                            CRIME REDUCTION
                        </div>
                    </div>
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={13} color="var(--text-muted)" />
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>{rec.targetDistrict} District</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={13} color="var(--text-muted)" />
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{rec.expectedImpact.timeframe}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Users size={13} color="var(--text-muted)" />
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{rec.expectedImpact.beneficiaries}</span>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                        <button
                            onClick={() => setExpanded(e => !e)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                padding: '5px 12px', borderRadius: '6px', cursor: 'pointer',
                                background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                                color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600'
                            }}
                        >
                            {expanded ? <><ChevronUp size={14} /> Collapse</> : <><ChevronDown size={14} /> Details</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded Detail Panel */}
            {expanded && (
                <div style={{ borderTop: '1px solid var(--border-color)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                        
                        {/* Supporting Data */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                                <BarChart2 size={15} color="var(--accent-primary)" />
                                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Supporting Data</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {rec.supportingData.map((d, i) => <SupportingDataRow key={i} item={d} />)}
                            </div>
                        </div>

                        {/* Expected Impact */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                                <Target size={15} color="var(--accent-success)" />
                                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expected Impact</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981', marginBottom: '2px' }}>
                                        ↓{rec.expectedImpact.crimeReduction}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Estimated crime reduction over <strong>{rec.expectedImpact.timeframe}</strong></div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{rec.expectedImpact.beneficiaries}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Beneficiaries</div>
                                    </div>
                                    <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                        <ConfidencePip level={rec.expectedImpact.confidence} />
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Prediction</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Created {rec.createdAt} · Updated {rec.updatedAt}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button style={{
                                padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: '600',
                                background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                                color: 'var(--text-secondary)', cursor: 'pointer'
                            }}>
                                Export Report
                            </button>
                            <button style={{
                                padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: '600',
                                background: 'var(--accent-primary)', border: 'none',
                                color: '#fff', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '5px'
                            }}>
                                <ArrowUpRight size={13} /> Take Action
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── SUMMARY STATS BAR ────────────────────────────────────────────────────────
const SummaryStats = ({ recs }) => {
    const total     = recs.length;
    const critical  = recs.filter(r => r.priority === 'CRITICAL').length;
    const approved  = recs.filter(r => r.status  === 'APPROVED').length;
    const inProg    = recs.filter(r => r.status  === 'IN_PROGRESS').length;

    const stats = [
        { label: 'Total Recommendations', value: total,    color: 'var(--text-primary)' },
        { label: 'Critical Priority',      value: critical, color: '#dc2626'              },
        { label: 'Approved',               value: approved, color: '#10b981'              },
        { label: 'In Progress',            value: inProg,   color: '#3b82f6'              },
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
            {stats.map((s, i) => (
                <div key={i} className="glass-panel" style={{ padding: '16px 18px' }}>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: s.color, marginBottom: '4px' }}>{s.value}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.label}</div>
                </div>
            ))}
        </div>
    );
};

// ─── MAIN MODULE ─────────────────────────────────────────────────────────────
const PolicyRecommendations = () => {
    const [search, setSearch]       = useState('');
    const [priority, setPriority]   = useState('All');
    const [status, setStatus]       = useState('All');
    const [category, setCategory]   = useState('All');
    const [sortBy, setSortBy]       = useState('priority');
    
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const res = await api.get('/policy-recommendations');
                if (res.data && res.data.success) {
                    setRecommendations(res.data.data || []);
                } else {
                    setRecommendations([]);
                }
            } catch (err) {
                console.error('Error fetching policy recommendations:', err);
                setRecommendations([]);
            } finally {
                setLoading(false);
            }
        };
        fetchRecommendations();
    }, []);

    const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

    const filtered = recommendations
        .filter(r => priority  === 'All' || r.priority  === priority)
        .filter(r => status    === 'All' || r.status    === status)
        .filter(r => category  === 'All' || r.category  === category)
        .filter(r => !search   || r.title?.toLowerCase().includes(search.toLowerCase()) || r.targetDistrict?.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
            if (sortBy === 'impact' && a.expectedImpact && b.expectedImpact) return parseFloat(b.expectedImpact.crimeReduction) - parseFloat(a.expectedImpact.crimeReduction);
            if (sortBy === 'date')     return new Date(b.updatedAt) - new Date(a.updatedAt);
            return 0;
        });

    const selectStyle = {
        background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
        color: 'var(--text-primary)', padding: '8px 10px', borderRadius: '7px',
        fontSize: '12px', outline: 'none', cursor: 'pointer'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Summary */}
            <SummaryStats recs={recommendations} />

            {/* Filter Bar */}
            <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <Filter size={15} color="var(--text-muted)" />

                {/* Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '7px', padding: '7px 10px', flex: '1 1 180px' }}>
                    <Search size={13} color="var(--text-muted)" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search title or district..."
                        style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '12px', width: '100%' }}
                    />
                </div>

                <select value={priority} onChange={e => setPriority(e.target.value)} style={selectStyle}>
                    {ALL_PRIORITIES.map(p => <option key={p} value={p}>{p === 'All' ? 'All Priorities' : p}</option>)}
                </select>

                <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : STATUS_CFG[s]?.label || s}</option>)}
                </select>

                <select value={category} onChange={e => setCategory(e.target.value)} style={selectStyle}>
                    {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
                </select>

                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
                    <option value="priority">Sort: Priority</option>
                    <option value="impact">Sort: Impact</option>
                    <option value="date">Sort: Last Updated</option>
                </select>

                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }}>
                    {filtered.length} of {recommendations.length} shown
                </span>
            </div>

            {/* Cards */}
            {loading ? (
                <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Loader2 size={30} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 14px' }} />
                    <div style={{ fontSize: '15px' }}>Loading real-time policy recommendations...</div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
                    <Lightbulb size={40} color="var(--text-muted)" style={{ margin: '0 auto 14px' }} />
                    <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-secondary)' }}>No recommendations match your filters</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>There are no active policies in the database right now.</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filtered.map(rec => <RecommendationCard key={rec.id} rec={rec} />)}
                </div>
            )}
        </div>
    );
};

export default PolicyRecommendations;
