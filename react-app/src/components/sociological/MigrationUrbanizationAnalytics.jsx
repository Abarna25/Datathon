import React, { useState, useEffect, useCallback } from 'react';
import {
    Home, Sliders, Loader2, Sparkles, Globe
} from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, ZAxis
} from 'recharts';
import api from '../../services/api';

const INDICATOR_OPTIONS = [
    'Migration', 'Urbanization', 'Education Disparity', 'Youth Unemployment',
    'Population Density', 'Housing Insecurity', 'Substance Abuse Index',
    'Theft', 'Robbery', 'Cyber Fraud', 'Juvenile Crime', 'Assault'
];

const MigrationUrbanizationAnalytics = () => {
    const [migrationData, setMigrationData] = useState(null);
    const [urbanData, setUrbanData] = useState(null);
    const [socialIndicators, setSocialIndicators] = useState(null);
    const [loading, setLoading] = useState(true);

    // Custom Correlation Builder State
    const [indA, setIndA] = useState('Migration');
    const [indB, setIndB] = useState('Theft');
    const [corrResult, setCorrResult] = useState(null);
    const [corrLoading, setCorrLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get('/sociological/migration').catch(() => ({ data: { success: false } })),
            api.get('/sociological/urbanization').catch(() => ({ data: { success: false } })),
            api.get('/sociological/indicators').catch(() => ({ data: { success: false } }))
        ])
        .then(([migRes, urbRes, indRes]) => {
            if (migRes.data?.success) setMigrationData(migRes.data.data);
            if (urbRes.data?.success) setUrbanData(urbRes.data.data);
            if (indRes.data?.success) setSocialIndicators(indRes.data.data);
            setLoading(false);
        })
        .catch(err => {
            console.debug('[MigrationUrbanizationAnalytics] Error:', err);
            setLoading(false);
        });
    }, []);

    const handleCalculateCorrelation = useCallback(() => {
        setCorrLoading(true);
        api.post('/sociological/custom-correlation', { indicatorA: indA, indicatorB: indB })
            .then(res => {
                if (res.data?.success) setCorrResult(res.data.data);
                setCorrLoading(false);
            })
            .catch(err => {
                console.debug('[MigrationUrbanizationAnalytics] Correlation error:', err);
                setCorrLoading(false);
            });
    }, [indA, indB]);

    // Initial calculation on load
    useEffect(() => {
        handleCalculateCorrelation();
    }, [handleCalculateCorrelation]);

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px', color: 'var(--accent-primary)' }} />
                <div>Loading Migration, Urbanization & Social Correlation Analytics...</div>
            </div>
        );
    }

    const { kpis = {}, migrationHeatmap = [], trendTimeline = [], correlations = [] } = migrationData || {};
    const { metrics = {}, urbanCrimeCorrelations = [], districtGrowth = [] } = urbanData || {};

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* FEATURE 1: MIGRATION INTELLIGENCE */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                    <Globe size={20} color="var(--accent-primary)" />
                    <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>
                        Migration Intelligence & Demographic Flow Engine
                    </h3>
                </div>

                {/* Migration KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Inward Migration</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-primary)', marginTop: '2px' }}>{kpis.inwardMigration?.count}</div>
                        <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '2px' }}>{kpis.inwardMigration?.trend} vs prev yr</div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Interstate Migration</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#f59e0b', marginTop: '2px' }}>{kpis.interstateMigration?.count}</div>
                        <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: '2px' }}>{kpis.interstateMigration?.trend} volume</div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rural → Urban Flow</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981', marginTop: '2px' }}>{kpis.ruralToUrban?.count}</div>
                        <div style={{ fontSize: '10px', color: '#10b981', marginTop: '2px' }}>{kpis.ruralToUrban?.share} total inward</div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Seasonal Migration</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#8b5cf6', marginTop: '2px' }}>{kpis.seasonalMigration?.count}</div>
                        <div style={{ fontSize: '10px', color: '#8b5cf6', marginTop: '2px' }}>{kpis.seasonalMigration?.trend} peak cycles</div>
                    </div>
                </div>

                {/* Migration Density & Crime Overlay Heatmap Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
                    
                    {/* Migration vs Crime Timeline */}
                    <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px' }}>
                            Migration Volume vs Crime Rate Timeline
                        </div>
                        <div style={{ height: '200px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendTimeline}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.4} />
                                    <XAxis dataKey="period" stroke="var(--text-secondary)" fontSize={11} />
                                    <YAxis yAxisId="left" stroke="var(--accent-primary)" fontSize={11} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#ef4444" fontSize={11} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px' }} />
                                    <Line yAxisId="left" type="monotone" dataKey="migration" name="Migration Count" stroke="var(--accent-primary)" strokeWidth={2} />
                                    <Line yAxisId="right" type="monotone" dataKey="crime" name="Crime Incident Rate" stroke="#ef4444" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Migration Density Overlay Grid */}
                    <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                            Migration Density & Crime Overlay (District / Sector)
                        </div>
                        {migrationHeatmap.map((item, idx) => (
                            <div key={idx} style={{ padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                                <div>
                                    <strong style={{ color: 'var(--text-primary)' }}>{item.district} ({item.sector})</strong>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.taluk} · {item.village}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--accent-primary)' }}>Migr. Density {item.migrationDensity}</span>
                                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', background: item.riskLevel === 'CRITICAL' ? 'rgba(220,38,38,0.2)' : 'rgba(245,158,11,0.2)', color: item.riskLevel === 'CRITICAL' ? '#dc2626' : '#f59e0b' }}>
                                        {item.riskLevel}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Migration vs Crime Category Correlations */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                    {correlations.map((c, idx) => (
                        <div key={idx} style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', fontSize: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>{c.crimeCategory}</strong>
                                <span style={{ fontWeight: '800', color: '#10b981' }}>r = {c.correlationScore}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{c.explanation}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FEATURE 2: ADVANCED URBANIZATION ANALYSIS */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                    <Home size={20} color="#f59e0b" />
                    <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>
                        Advanced Urbanization & Infrastructure Analytics
                    </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', fontSize: '12px' }}>
                        <div style={{ color: 'var(--text-muted)' }}>Population Density</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>{metrics.popDensity}</div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', fontSize: '12px' }}>
                        <div style={{ color: 'var(--text-muted)' }}>Urban Growth Rate</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#f59e0b', marginTop: '2px' }}>{metrics.urbanGrowthRate}</div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', fontSize: '12px' }}>
                        <div style={{ color: 'var(--text-muted)' }}>Slum Concentration</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#ef4444', marginTop: '2px' }}>{metrics.slumConcentration}</div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', fontSize: '12px' }}>
                        <div style={{ color: 'var(--text-muted)' }}>Commercial Expansion</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#10b981', marginTop: '2px' }}>{metrics.commercialExpansion}</div>
                    </div>
                </div>

                {/* Urbanization vs Crime Correlations */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                    {urbanCrimeCorrelations.map((uc, i) => (
                        <div key={i} style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>{uc.factor}</strong>
                                <span style={{ fontWeight: '800', color: '#10b981' }}>Score: {uc.correlation}</span>
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{uc.evidence}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FEATURE 3 & 4: SOCIOLOGICAL CORRELATION ENGINE */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                    <Sliders size={20} color="#8b5cf6" />
                    <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>
                        Sociological Correlation Builder Engine
                    </h3>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Indicator A:</span>
                        <select
                            value={indA}
                            onChange={e => setIndA(e.target.value)}
                            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '6px', outline: 'none', fontSize: '13px' }}
                        >
                            {INDICATOR_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>

                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#8b5cf6' }}>VS</span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Indicator B:</span>
                        <select
                            value={indB}
                            onChange={e => setIndB(e.target.value)}
                            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '6px', outline: 'none', fontSize: '13px' }}
                        >
                            {INDICATOR_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>

                    <button
                        onClick={handleCalculateCorrelation}
                        disabled={corrLoading}
                        style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: 'var(--accent-primary)', color: '#ffffff', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        {corrLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} Calculate Correlation
                    </button>
                </div>

                {/* Result Display */}
                {corrResult && (
                    <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                {corrResult.indicatorA} vs {corrResult.indicatorB}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <span style={{ fontSize: '16px', fontWeight: '800', color: '#10b981' }}>Pearson r = {corrResult.pearsonR}</span>
                                <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                                    {corrResult.confidenceScore} CONFIDENCE
                                </span>
                            </div>
                        </div>

                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            {corrResult.explanation}
                        </div>

                        {/* Scatter Plot */}
                        <div style={{ height: '220px', width: '100%', marginTop: '6px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.4} />
                                    <XAxis type="number" dataKey="x" name={corrResult.indicatorA} stroke="var(--text-secondary)" fontSize={11} />
                                    <YAxis type="number" dataKey="y" name={corrResult.indicatorB} stroke="var(--text-secondary)" fontSize={11} />
                                    <ZAxis type="category" dataKey="label" name="District" />
                                    <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px' }} />
                                    <Scatter name="District Correlations" data={corrResult.scatterPoints} fill="var(--accent-primary)" />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MigrationUrbanizationAnalytics;
