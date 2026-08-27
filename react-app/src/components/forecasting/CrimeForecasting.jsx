import React, { useState, useEffect, useCallback } from 'react';
import {
    TrendingUp, ShieldAlert, AlertTriangle, MapPin, Activity,
    Calendar, Layers, CheckCircle2, ChevronRight, RefreshCw,
    Loader2, Cpu, BarChart2, Zap, Flame, Filter, FileText
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    Legend, ResponsiveContainer, AreaChart, Area, ComposedChart, Line
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import MapView from '../MapView';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const CrimeForecasting = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [hotspots, setHotspots] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [geospatialData, setGeospatialData] = useState([]);
    const [loading, setLoading] = useState(true);

    // XAI Explanation Drawer state
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [explaining, setExplaining] = useState(false);
    const [explanation, setExplanation] = useState(null);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get('/forecasting/dashboard'),
            api.get('/forecasting/hotspots'),
            api.get('/forecasting/early-warning'),
            api.get('/forecasting/geospatial')
        ])
        .then(([dashRes, hotRes, alertRes, geoRes]) => {
            if (dashRes.data.success) setDashboardData(dashRes.data.data);
            if (hotRes.data.success) setHotspots(hotRes.data.data);
            if (alertRes.data.success) setAlerts(alertRes.data.data);
            if (geoRes.data.success) setGeospatialData(geoRes.data.data);
            setLoading(false);
        })
        .catch(err => {
            console.debug('[CrimeForecasting] Error:', err);
            setLoading(false);
        });
    }, []);

    const handleExplainPrediction = useCallback((alertId) => {
        setExplaining(true);
        setSelectedAlert(alertId);
        setExplanation(null);

        api.post('/forecasting/explain-prediction', { alertId })
            .then(res => {
                if (res.data.success) setExplanation(res.data.data);
                setExplaining(false);
            })
            .catch(err => {
                console.debug('[CrimeForecasting] Explain error:', err);
                setExplaining(false);
            });
    }, []);

    if (loading) {
        return (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Loader2 className="animate-spin" size={36} style={{ margin: '0 auto 12px', color: 'var(--accent-primary)' }} />
                <div>Generating Predictive Spatial-Temporal Crime Forecasts...</div>
            </div>
        );
    }

    const { weeklyPrediction = [], monthlyPrediction = [], districtForecast = [], crimeTypeForecast = [] } = dashboardData || {};

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Header Banner */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <TrendingUp size={24} color="var(--accent-primary)" />
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
                            Crime Forecasting & Early Warning Command
                        </h2>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Automated time-series predictive modeling, emerging hotspot detection & real-time risk alerts
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Flame size={14} /> 3 CRITICAL ALERTS ACTIVE
                    </span>
                </div>
            </div>

            {/* Early Warning Alerts Section */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                    <ShieldAlert size={20} color="#ef4444" />
                    <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>
                        Early Warning System — Active Threat Alerts
                    </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                    {alerts && alerts.length > 0 ? (
                        alerts.map(a => (
                            <div key={a.id} style={{ padding: '16px', borderRadius: '10px', background: 'var(--bg-secondary)', border: `1px solid ${a.severity === 'CRITICAL' ? '#dc2626' : 'var(--border-color)'}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '800', background: a.severity === 'CRITICAL' ? 'rgba(220,38,38,0.2)' : 'rgba(245,158,11,0.2)', color: a.severity === 'CRITICAL' ? '#dc2626' : '#f59e0b' }}>
                                        {a.severity || a.threatLevel}
                                    </span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{a.district}</span>
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1.4' }}>{a.title || `Alert: ${a.district}`}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{a.summary || a.description}</div>
                                <div style={{ fontSize: '11px', color: 'var(--accent-primary)', background: 'rgba(59,130,246,0.08)', padding: '8px', borderRadius: '6px' }}>
                                    <strong>Recommended Action:</strong> {a.recommendedAction || 'Increase patrol vigilance in the affected area.'}
                                </div>
                                <button
                                    onClick={() => handleExplainPrediction(a.id)}
                                    style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}
                                >
                                    <Cpu size={12} color="var(--accent-primary)" /> Explain Prediction Model (XAI)
                                </button>
                            </div>
                        ))
                    ) : (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '10px' }}>
                            Insufficient data to generate predictive alerts.
                        </div>
                    )}
                </div>

                {/* XAI Explanation Drawer */}
                {explaining && (
                    <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>
                        <Loader2 className="animate-spin" size={14} style={{ display: 'inline', marginRight: '6px' }} /> Extracting predictive model weights...
                    </div>
                )}
                {explanation && (
                    <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '13px', color: '#8b5cf6' }}>XAI Prediction Explanation — {explanation.target}</strong>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#10b981' }}>{(explanation.confidenceScore * 100).toFixed(0)}% CONFIDENCE</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}><strong>Historical Baseline Trend:</strong> {explanation.historicalTrend}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <strong>Factors Considered:</strong>
                            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                {explanation.factorsConsidered.map((f, i) => <li key={i}>{f}</li>)}
                            </ul>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <strong>Reasoning Chain:</strong>
                            <ol style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                {explanation.reasoning.map((r, i) => <li key={i}>{r}</li>)}
                            </ol>
                        </div>
                    </div>
                )}
            </div>

            {/* Weekly Forecast Chart & District Risk Table */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
                
                {/* Weekly Crime Forecast Chart */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart2 size={18} color="var(--accent-primary)" />
                        <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>7-Day Predictive Crime Volume</h3>
                    </div>
                    <div style={{ height: '240px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={weeklyPrediction}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} />
                                <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={12} />
                                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px' }} />
                                <Bar dataKey="predictedCrimes" name="Predicted Crimes" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="actualBaseline" name="4-Wk Baseline Avg" stroke="#ef4444" strokeWidth={2} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* District Risk Forecast Table */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={18} color="#f59e0b" />
                        <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>District-Level Risk Forecast</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {districtForecast.map((d, i) => (
                            <div key={i} style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{d.district}</strong>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Est. {d.predictedIncidents} incidents next 30 days</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '14px', fontWeight: '800', color: d.status === 'CRITICAL' ? '#dc2626' : d.status === 'HIGH' ? '#ef4444' : '#10b981' }}>
                                        {d.riskScore} / 100
                                    </div>
                                    <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>{d.status}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Geospatial Crime Map */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={18} color="#3b82f6" />
                    <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>Geospatial Crime Map</h3>
                </div>
                {geospatialData && geospatialData.length > 0 ? (
                    <div style={{ height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <MapView 
                            nodes={geospatialData.map(c => ({
                                id: c.id,
                                type: 'case',
                                lat: c.latitude,
                                lng: c.longitude,
                                label: `Case #${c.caseNumber} - ${c.crimeType}`
                            }))}
                            onNodeSelect={(node) => navigate(`/cases/${node.id}`)}
                        />
                    </div>
                ) : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '20px', textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                        Insufficient geographic data. No historical cases with mapped coordinates found.
                    </div>
                )}
            </div>

            {/* Hotspots Density Grid */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Flame size={18} color="#dc2626" />
                    <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>Emerging Hotspots & Crime Density Ranking</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                    {hotspots && hotspots.length > 0 ? (
                        hotspots.map((h, idx) => (
                            <div key={h.id || idx} style={{ padding: '16px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '12px', background: 'rgba(220,38,38,0.15)', color: '#dc2626' }}>
                                        {h.caseCount} RECORDED CASES
                                    </span>
                                </div>
                                <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>{h.location}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}><strong>Dominant Crime:</strong> <span style={{color: '#f59e0b'}}>{h.dominantCrime}</span></div>
                                {h.explanation && (
                                    <div style={{ marginTop: '4px', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', color: 'var(--text-muted)' }}>
                                        <div style={{ marginBottom: '4px' }}><strong>WHAT:</strong> {h.explanation.what}</div>
                                        <div style={{ marginBottom: '4px' }}><strong>WHY:</strong> {h.explanation.why}</div>
                                        <div><strong>SOURCE:</strong> {h.explanation.source}</div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '10px' }}>
                            Insufficient geographic data to detect hotspots.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CrimeForecasting;
