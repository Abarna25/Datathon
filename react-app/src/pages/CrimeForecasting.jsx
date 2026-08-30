import React, { useEffect, useState } from 'react';
import { TrendingUp, AlertTriangle, ShieldAlert, Database, Clock, Calendar, CheckCircle } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { motion } from 'framer-motion';
import api from '../services/api';
import AIAssistantPanel from '../components/AIAssistantPanel';

const CrimeForecasting = () => {
  const [forecast, setForecast] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIntelligence();
  }, []);

  const fetchIntelligence = async () => {
    try {
      setLoading(true);
      const [forecastRes, warningsRes] = await Promise.all([
        api.get('/intelligence/forecast/overview').catch(() => ({ data: { success: false } })),
        api.get('/intelligence/forecast/early-warnings').catch(() => ({ data: { success: false } }))
      ]);

      if (forecastRes.data?.success) {
        setForecast(forecastRes.data);
      } else {
        throw new Error(forecastRes.data?.error || 'Failed to fetch forecast');
      }

      if (warningsRes.data?.success && warningsRes.data?.data) {
        setWarnings(warningsRes.data.data);
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
          <TrendingUp size={48} color="#3b82f6" />
        </motion.div>
        <div style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Calculating Deterministic Baseline Forecasts...</div>
      </div>
    );
  }

  if (error || !forecast) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
        <AlertTriangle size={48} color="#ef4444" />
        <div style={{ marginTop: '16px', color: '#ef4444' }}>{error || 'Forecast engine offline.'}</div>
      </div>
    );
  }

  const isInsufficient = forecast.status === "INSUFFICIENT_DATA";
  const fData = forecast.data || {};

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto' }}>
      <div>
        <h1 className="page-title">Crime Forecasting & Early Warning</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Deterministic time-series analysis and anomaly detection.</p>
      </div>

      <AIAssistantPanel 
        title="Forecasting Constraints" 
        content="This module DOES NOT use 'AI' to predict individual crimes. It applies deterministic statistical moving averages to historical incident volumes to detect aggregate trend anomalies."
        delay={200}
      />

      {/* Early Warnings Banner */}
      {warnings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {warnings.map((warn, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: idx * 0.1 }}
              style={{ 
                background: warn.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)', 
                border: `1px solid ${warn.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`, 
                padding: '16px 20px', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '16px' 
              }}
            >
              <ShieldAlert size={24} color={warn.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'} style={{ marginTop: '4px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ color: warn.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b', fontSize: '14px' }}>
                    EARLY WARNING: {warn.type} DETECTED
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(warn.generated_at).toLocaleString()}</span>
                </div>
                <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '13.5px', marginBottom: '8px' }}>{warn.reason}</p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span><strong>Rule:</strong> {warn.rule}</span>
                  <span><strong>Baseline:</strong> {warn.baseline}</span>
                  <span><strong>Observed:</strong> {warn.observed_change}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {isInsufficient ? (
        <div style={{ padding: '40px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <AlertTriangle size={32} color="#f59e0b" style={{ marginBottom: '12px' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>INSUFFICIENT DATA</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            {forecast.message} This module requires at least {forecast.evidence?.records_required} historical verified records to calculate a statistically sound moving average.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
          
          {/* Main Chart Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Historical Baseline</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{fData.baseline}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Avg over preceding 30 days</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Recent Average</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{fData.recentAverage}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Avg over last 30 days</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Forecast (Next 30D)</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{fData.forecastValue}</div>
                <div style={{ fontSize: '12px', color: fData.trend === 'INCREASING' ? '#ef4444' : (fData.trend === 'DECREASING' ? '#10b981' : '#3b82f6'), marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {fData.trendPercentage > 0 ? '▲' : (fData.trendPercentage < 0 ? '▼' : '—')} {Math.abs(fData.trendPercentage)}% Trend
                </div>
              </div>
            </div>

            {/* Historical Trend Chart */}
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', height: '400px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="#3b82f6" /> Historical Trend vs Moving Average
              </h3>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={fData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis dataKey="period" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip cursor={{ stroke: 'var(--border-color)', strokeWidth: 1, strokeDasharray: '5 5' }} contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="actualCases" name="Actual Cases" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
                    <Area type="monotone" dataKey="movingAverage" name="Moving Average" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAvg)" />
                    <ReferenceLine y={fData.baseline} label={{ position: 'top', value: 'Historical Baseline', fill: 'var(--text-muted)', fontSize: 11 }} stroke="#f59e0b" strokeDasharray="3 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Forecast Explanation Side Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                Explanation & Evidence
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Records Analyzed</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Database size={14} color="#3b82f6" /> {fData.historicalRecords} Confirmed FIRs</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Calculation Method</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{fData.method}</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Data Reliability</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: fData.reliability === 'HIGH' ? '#10b981' : (fData.reliability === 'MEDIUM' ? '#f59e0b' : '#ef4444'), padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', display: 'inline-block' }}>
                    {fData.reliability}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Backtest Validation</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={14} color="#10b981" /> {fData.validation?.metric}: {fData.validation?.value}</div>
                </div>
                
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Forecast Period</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} color="#8b5cf6" /> {fData.forecastPeriod}</div>
                </div>
              </div>
            </div>
            
            <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '8px' }}>
              <strong style={{ color: '#ef4444', fontSize: '12px', display: 'block', marginBottom: '8px' }}>SYSTEM LIMITATIONS</strong>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>
                {forecast.limitations?.[0]}
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default CrimeForecasting;
