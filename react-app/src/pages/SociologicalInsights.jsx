import React, { useEffect, useState } from 'react';
import { Users, AlertTriangle, Database, FileSearch, PieChart, BarChart as BarChartIcon, Network, ShieldCheck, Info, LineChart } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import api from '../services/api';
import AIAssistantPanel from '../components/AIAssistantPanel';

const COLORS = ['var(--accent-primary)', 'var(--accent-success)', 'var(--accent-warning)', 'var(--accent-danger)', '#8b5cf6', '#06b6d4'];

const SociologicalInsights = () => {
  const [activeTab, setActiveTab] = useState('correlation'); // 'correlation' | 'demographics'
  const [data, setData] = useState(null);
  const [correlationData, setCorrelationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const [demoRes, corrRes] = await Promise.all([
        api.get('/intelligence/sociological/demographics').catch(() => ({ data: { success: false } })),
        api.get('/intelligence/sociological/correlation').catch(() => ({ data: { success: false } }))
      ]);

      if (demoRes.data?.success) {
        setData(demoRes.data);
      }
      if (corrRes.data?.success && corrRes.data?.data) {
        setCorrelationData(corrRes.data.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <Users size={48} color="var(--accent-primary)" />
        </motion.div>
        <div style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Aggregating Socio-Economic & Correlation Intelligence...</div>
      </div>
    );
  }

  if (error && !data && !correlationData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
        <AlertTriangle size={48} color="var(--accent-danger)" />
        <div style={{ marginTop: '16px', color: 'var(--accent-danger)' }}>{error || 'Data unavailable.'}</div>
      </div>
    );
  }

  const isInsufficient = data?.status === "INSUFFICIENT_DATA";
  const cDistricts = correlationData?.districtRiskIndices || [];
  const cCorrelations = correlationData?.correlations || [];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Sociological & Social Risk Intelligence</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Socio-economic indicator analysis, correlation engine, and explainable Social Risk Index.</p>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '4px', gap: '4px' }}>
          <button
            onClick={() => setActiveTab('correlation')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: activeTab === 'correlation' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'correlation' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease'
            }}
          >
            <Network size={16} /> Social Risk Correlation
          </button>
          <button
            onClick={() => setActiveTab('demographics')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: activeTab === 'demographics' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'demographics' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease'
            }}
          >
            <Users size={16} /> Demographic Distribution
          </button>
        </div>
      </div>

      <AIAssistantPanel 
        title="Responsible AI & Correlation Governance" 
        content="Statistical correlation does not establish causation. This analysis operates strictly on geographic district-level statistics. No religion, caste, ethnicity, or protected groups are profiled."
        delay={200}
      />

      {/* Simulated Data Banner */}
      <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '12px 20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Info size={18} color="var(--accent-warning)" />
          <div>
            <strong style={{ color: 'var(--accent-warning)', fontSize: '13px', display: 'block' }}>
              SIMULATED SOCIO-ECONOMIC DATA — FOR PROTOTYPE ANALYTICS ONLY
            </strong>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              External demographic layer derived from demonstration datasets. Statistical correlation does not establish causation.
            </span>
          </div>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-warning)', background: 'rgba(245, 158, 11, 0.15)', padding: '4px 10px', borderRadius: '6px' }}>
          PROTOTYPE ANALYTICS
        </span>
      </div>

      {/* TAB 1: SOCIAL RISK CORRELATION & SOCIO-ECONOMIC LAYER */}
      {activeTab === 'correlation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Socio-Economic Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Avg Population Density</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>785 / km²</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>District-level aggregate</div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Avg Literacy Rate</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-success)' }}>75.2%</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>State average baseline</div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Avg Employment Rate</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-warning)' }}>51.5%</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Formal & informal labor</div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Avg Urbanization</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>42.4%</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Urban vs rural ratio</div>
            </div>
          </div>

          {/* Crime Correlation Analysis Table */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LineChart size={18} color="var(--accent-primary)" /> Crime vs Socio-Economic Indicator Correlation Analysis
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '10px' }}>Social Indicator</th>
                    <th style={{ padding: '10px' }}>Pearson R</th>
                    <th style={{ padding: '10px' }}>Correlation Strength</th>
                    <th style={{ padding: '10px' }}>Sample Size</th>
                    <th style={{ padding: '10px' }}>Confidence</th>
                    <th style={{ padding: '10px' }}>Statistical Interpretation</th>
                  </tr>
                </thead>
                <tbody>
                  {cCorrelations.map((corr, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: '600' }}>{corr.indicator}</td>
                      <td style={{ padding: '12px 10px', fontWeight: '700', color: corr.correlation > 0 ? 'var(--accent-primary)' : 'var(--accent-success)' }}>
                        {corr.correlation > 0 ? '+' : ''}{corr.correlation}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                          {corr.strength}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{corr.sampleSize} Districts</td>
                      <td style={{ padding: '12px 10px', color: 'var(--accent-success)', fontWeight: '600' }}>{(corr.confidence * 100).toFixed(0)}%</td>
                      <td style={{ padding: '12px 10px', fontSize: '12px', color: 'var(--text-secondary)' }}>{corr.interpretation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={14} /> Statistical correlation does not establish causation.
            </div>
          </div>

          {/* Social Risk Index per District */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--accent-success)" /> District Social Risk Index Breakdown
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {cDistricts.map((d, idx) => (
                <div key={idx} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{d.district}</strong>
                    <span style={{ fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', background: d.riskLevel === 'High' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)', color: d.riskLevel === 'High' ? 'var(--accent-danger)' : 'var(--accent-primary)' }}>
                      Risk Index: {d.socialRiskIndex} ({d.riskLevel})
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Population Pressure:</span> <strong>{d.contributingFactors?.populationPressure}/100</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Urbanization:</span> <strong>{d.contributingFactors?.urbanization}/100</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Employment Indicator:</span> <strong>{d.contributingFactors?.employmentIndicator}/100</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Education Indicator:</span> <strong>{d.contributingFactors?.educationIndicator}/100</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Crime Pattern Score:</span> <strong>{d.contributingFactors?.crimePatternScore}/100</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: DEMOGRAPHIC DISTRIBUTION */}
      {activeTab === 'demographics' && (
        isInsufficient ? (
          <div style={{ padding: '40px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <AlertTriangle size={32} color="var(--accent-warning)" style={{ marginBottom: '12px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>INSUFFICIENT DATA</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              {data?.message} This module requires at least {data?.evidence?.records_required} verified records to generate a statistically relevant analysis.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            
            {/* Age Distribution */}
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChart size={18} color="var(--accent-primary)" /> Age Group Distribution
              </h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.data?.ageDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis dataKey="group" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                    <Bar dataKey="percentage" name="Percentage %" radius={[4, 4, 0, 0]}>
                      {(data?.data?.ageDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                * Observed pattern based strictly on {data?.evidence?.records_analyzed} available records.
              </div>
            </div>

            {/* Gender Distribution */}
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="var(--accent-success)" /> Gender Distribution
              </h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.data?.genderDistribution || []} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="category" type="category" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} width={80} />
                    <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                    <Bar dataKey="percentage" name="Percentage %" fill="var(--accent-success)" radius={[0, 4, 4, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                * Recorded distribution, does not infer missing values.
              </div>
            </div>

          </div>
        )
      )}

    </div>
  );
};

export default SociologicalInsights;

