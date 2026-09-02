import React, { useEffect, useState } from 'react';
import { TrendingUp, AlertTriangle, ShieldAlert, Database, Clock, Calendar, CheckCircle, CalendarDays, Sparkles, BarChart2 } from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { motion } from 'framer-motion';
import api from '../services/api';
import AIAssistantPanel from '../components/AIAssistantPanel';

const CrimeForecasting = () => {
  const [activeTab, setActiveTab] = useState('forecast'); // 'forecast' | 'seasonal'
  const [forecast, setForecast] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [seasonalData, setSeasonalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIntelligence();
  }, []);

  const fetchIntelligence = async () => {
    try {
      setLoading(true);
      const [forecastRes, warningsRes, seasonalRes] = await Promise.all([
        api.get('/intelligence/forecast/overview').catch(() => ({ data: { success: false } })),
        api.get('/intelligence/forecast/early-warnings').catch(() => ({ data: { success: false } })),
        api.get('/intelligence/forecast/seasonal').catch(() => ({ data: { success: false } }))
      ]);

      if (forecastRes.data?.success) {
        setForecast(forecastRes.data);
      } else {
        throw new Error(forecastRes.data?.error || 'Failed to fetch forecast');
      }

      if (warningsRes.data?.success && warningsRes.data?.data) {
        setWarnings(warningsRes.data.data);
      }

      if (seasonalRes.data?.success && seasonalRes.data?.data) {
        setSeasonalData(seasonalRes.data.data);
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
          <TrendingUp size={48} color="var(--accent-primary)" />
        </motion.div>
        <div style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Calculating Deterministic Baseline & Seasonal Forecasts...</div>
      </div>
    );
  }

  if (error || !forecast) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
        <AlertTriangle size={48} color="var(--accent-danger)" />
        <div style={{ marginTop: '16px', color: 'var(--accent-danger)' }}>{error || 'Forecast engine offline.'}</div>
      </div>
    );
  }

  const isInsufficient = forecast.status === "INSUFFICIENT_DATA";
  const fData = forecast.data || {};
  const sCards = seasonalData?.summaryCards || {};

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Crime Forecasting & Seasonal Intelligence</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Deterministic time-series analysis, event anomaly detection, and seasonal trend modeling.</p>
        </div>

        {/* Workspace Navigation Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '4px', gap: '4px' }}>
          <button
            onClick={() => setActiveTab('forecast')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: activeTab === 'forecast' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'forecast' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease'
            }}
          >
            <TrendingUp size={16} /> 30-Day Trend Forecast
          </button>
          <button
            onClick={() => setActiveTab('seasonal')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: activeTab === 'seasonal' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'seasonal' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease'
            }}
          >
            <CalendarDays size={16} /> Seasonal & Event Intelligence
          </button>
        </div>
      </div>

      <AIAssistantPanel 
        title="Forecasting & Seasonal Intelligence Constraints" 
        content="This module applies explainable statistical moving averages and event window baseline comparisons. It does NOT profile individuals or make ungrounded predictions."
        delay={200}
      />

      {/* Early Warnings Banner */}
      {warnings.length > 0 && activeTab === 'forecast' && (
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
              <ShieldAlert size={24} color={warn.severity === 'CRITICAL' ? 'var(--accent-danger)' : 'var(--accent-warning)'} style={{ marginTop: '4px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ color: warn.severity === 'CRITICAL' ? 'var(--accent-danger)' : 'var(--accent-warning)', fontSize: '14px' }}>
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

      {/* TAB 1: FORECAST OVERVIEW */}
      {activeTab === 'forecast' && (
        isInsufficient ? (
          <div style={{ padding: '40px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <AlertTriangle size={32} color="var(--accent-warning)" style={{ marginBottom: '12px' }} />
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
                  <div style={{ fontSize: '12px', color: fData.trend === 'INCREASING' ? 'var(--accent-danger)' : (fData.trend === 'DECREASING' ? 'var(--accent-success)' : 'var(--accent-primary)'), marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {fData.trendPercentage > 0 ? '▲' : (fData.trendPercentage < 0 ? '▼' : '—')} {Math.abs(fData.trendPercentage)}% Trend
                  </div>
                </div>
              </div>

              {/* Historical Trend Chart */}
              <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', height: '400px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} color="var(--accent-primary)" /> Historical Trend vs Moving Average
                </h3>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={fData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-success)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--accent-success)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                      <XAxis dataKey="period" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip cursor={{ stroke: 'var(--border-color)', strokeWidth: 1, strokeDasharray: '5 5' }} contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                      <Area type="monotone" dataKey="actualCases" name="Actual Cases" stroke="var(--accent-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
                      <Area type="monotone" dataKey="movingAverage" name="Moving Average" stroke="var(--accent-success)" strokeWidth={2} fillOpacity={1} fill="url(#colorAvg)" />
                      <ReferenceLine y={fData.baseline} label={{ position: 'top', value: 'Historical Baseline', fill: 'var(--text-muted)', fontSize: 11 }} stroke="var(--accent-warning)" strokeDasharray="3 3" />
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
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Database size={14} color="var(--accent-primary)" /> {fData.historicalRecords} Confirmed FIRs</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Calculation Method</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{fData.method}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Data Reliability</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: fData.reliability === 'HIGH' ? 'var(--accent-success)' : (fData.reliability === 'MEDIUM' ? 'var(--accent-warning)' : 'var(--accent-danger)'), padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', display: 'inline-block' }}>
                      {fData.reliability}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Backtest Validation</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={14} color="var(--accent-success)" /> {fData.validation?.metric}: {fData.validation?.value}</div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Forecast Period</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} color="#8b5cf6" /> {fData.forecastPeriod}</div>
                  </div>
                </div>
              </div>
              
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--accent-danger)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>SYSTEM LIMITATIONS</strong>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>
                  {forecast.limitations?.[0]}
                </p>
              </div>
            </div>

          </div>
        )
      )}

      {/* TAB 2: SEASONAL & EVENT INTELLIGENCE */}
      {activeTab === 'seasonal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Seasonal KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Peak Crime Month</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{sCards.peakCrimeMonth || 'August'}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Highest monthly volume</div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Highest Risk Day</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--accent-warning)' }}>{sCards.highestRiskDay || 'Saturday'}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Peak day-of-week frequency</div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Lowest Risk Day</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--accent-success)' }}>{sCards.lowestRiskDay || 'Tuesday'}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Lowest day-of-week frequency</div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Dataset Coverage</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{sCards.totalAnalyzedRecords || 0} Records</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{sCards.detailedTimeAvailable ? 'Time-of-Day Enabled' : 'Date-Level Granularity'}</div>
            </div>
          </div>

          {/* Charts Row: Monthly Trend & Weekly Distribution */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Monthly Crime Trend */}
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', height: '360px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={18} color="var(--accent-primary)" /> Month-Wise Crime Trends (Jan - Dec)
              </h3>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seasonalData?.monthlyTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                    <Bar dataKey="crimeCount" name="Crime Incidents" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Day of Week Patterns */}
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', height: '360px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarDays size={18} color="var(--accent-warning)" /> Day-of-Week Crime Patterns
              </h3>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seasonalData?.dailyPatterns || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                    <Bar dataKey="crimeCount" name="Incident Count" fill="var(--accent-warning)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Festival and Event-Based Crime Intelligence */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--accent-primary)" /> Festival & Public Event Window Intelligence
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Karnataka Event Window vs Historical Baseline Deviation Analysis</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '4px 10px', borderRadius: '6px' }}>
                Statistical Correlation Mode
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '10px' }}>Event Name</th>
                    <th style={{ padding: '10px' }}>Window</th>
                    <th style={{ padding: '10px' }}>Baseline</th>
                    <th style={{ padding: '10px' }}>Observed</th>
                    <th style={{ padding: '10px' }}>Deviation</th>
                    <th style={{ padding: '10px' }}>Anomaly Score</th>
                    <th style={{ padding: '10px' }}>Evidence Insight</th>
                  </tr>
                </thead>
                <tbody>
                  {(seasonalData?.eventIntelligence || []).map((ev, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: '600' }}>{ev.event}</td>
                      <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{ev.eventWindow}</td>
                      <td style={{ padding: '12px 10px' }}>{ev.historicalBaseline}</td>
                      <td style={{ padding: '12px 10px', fontWeight: '600' }}>{ev.observedCrimeCount}</td>
                      <td style={{ padding: '12px 10px', color: ev.percentageChange > 10 ? 'var(--accent-danger)' : (ev.percentageChange < -5 ? 'var(--accent-success)' : 'var(--accent-primary)'), fontWeight: '600' }}>
                        {ev.percentageChange >= 0 ? '+' : ''}{ev.percentageChange}%
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', background: ev.anomalyScore > 1.5 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)', color: ev.anomalyScore > 1.5 ? 'var(--accent-danger)' : 'var(--accent-primary)' }}>
                          {ev.anomalyScore}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {ev.neutralInsight}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default CrimeForecasting;

