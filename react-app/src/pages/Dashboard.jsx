import React, { useEffect, useState } from 'react';
import { 
  Shield, FileText, AlertTriangle, Users, Activity, CheckSquare, 
  Map, Target, Cpu, Clock, Bell, Info, TrendingUp, Search, Briefcase, Bot, Network, FileSearch, Database, Server, TerminalSquare
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis 
} from 'recharts';
import { motion } from 'framer-motion';
import styles from './Dashboard.module.css';
import api from '../services/api';
import AIAssistantPanel from '../components/AIAssistantPanel';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f43f5e'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100, damping: 12 }
  }
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [emergingPatterns, setEmergingPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, patRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/intelligence/patterns/emerging').catch(() => ({ data: { success: false } }))
      ]);

      if (dashRes.data.success) {
        setData(dashRes.data.data);
      } else {
        throw new Error(dashRes.data.error || 'Failed to fetch data');
      }

      if (patRes.data?.success) {
        setEmergingPatterns(patRes.data.data?.patterns || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <Cpu size={48} color="#3b82f6" />
        </motion.div>
        <div style={{ marginTop: '16px', color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
          Initializing AI Command Center...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.container} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <AlertTriangle size={48} color="#ef4444" />
        <div style={{ marginTop: '16px', color: '#ef4444' }}>Command Center Offline.</div>
      </div>
    );
  }

  const getRiskColor = (risk) => {
    if (risk === 'High') return '#ef4444';
    if (risk === 'Medium') return '#f59e0b';
    return '#10b981';
  };

  const getStatusColor = (status) => {
    if (status === 'Active') return '#3b82f6';
    if (status === 'Closed') return '#64748b';
    return '#8b5cf6';
  };

  return (
    <motion.div className={styles.container} variants={containerVariants} initial="hidden" animate="visible">
      
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Good Evening, Officer.</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Welcome to the VIKSHANA AI Command Center.</p>
      </div>

      {/* VIKSHANA 2.0 Live Emerging Pattern & Crime Surge Alerts */}
      {emergingPatterns.length > 0 && (
        <motion.div variants={itemVariants} style={{ marginBottom: '20px', padding: '16px 20px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: '800', fontSize: '13px' }}>
              <AlertTriangle size={18} />
              <span>EMERGING CRIME PATTERN & SURGE ALERTS ({emergingPatterns.length} ACTIVE)</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Automated Aggregate Density Shift Detection</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {emergingPatterns.slice(0, 3).map((pat, i) => (
              <div key={pat.patternId || i} style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{pat.title}</strong>
                  <span style={{ fontSize: '10.5px', fontWeight: '800', padding: '2px 6px', borderRadius: '6px', background: pat.severity === 'CRITICAL' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: pat.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b' }}>
                    {pat.percentageChange}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{pat.detectionBasis}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--accent-primary)', marginTop: '2px' }}>
                  <strong>Action:</strong> {pat.recommendedIntervention}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ROW 1: Executive KPI Cards */}
      <motion.div className={styles.kpiGrid} variants={itemVariants}>
        {[
          { title: 'Active Investigations', value: data.stats?.openCases || 0, trend: '▲ 14 today', subtitle: `${data.stats?.highRiskCases || 0} High Risk`, icon: <Briefcase size={20} color="#3b82f6" />, bg: 'rgba(59,130,246,0.1)' },
          { title: 'FIRs Today', value: data.stats?.todaysFIR || 0, trend: 'Steady', subtitle: `Avg Closure: ${data.stats?.avgClosureTime || 18} Days`, icon: <FileText size={20} color="#10b981" />, bg: 'rgba(16,185,129,0.1)' },
          { title: 'High Risk Cases', value: data.stats?.highRiskCases || 0, trend: '▼ 2% MoM', subtitle: 'Priority Monitoring', icon: <AlertTriangle size={20} color="#ef4444" />, bg: 'rgba(239,68,68,0.1)' },
          { title: 'Pending Evidence', value: data.stats?.pendingEvidence || 0, trend: '▲ 5 suspects', subtitle: 'At large', icon: <FileSearch size={20} color="#f59e0b" />, bg: 'rgba(245,158,11,0.1)' },
          { title: 'AI Alerts', value: data.alerts?.length || 0, trend: 'Live', subtitle: 'Generated dynamically', icon: <Bot size={20} color="#8b5cf6" />, bg: 'rgba(139,92,246,0.1)' },
          { title: 'Officers Online', value: data.stats?.officersOnline || 0, trend: 'Peak', subtitle: 'Active Catalyst sessions', icon: <Users size={20} color="#06b6d4" />, bg: 'rgba(6,182,212,0.1)' },
        ].map((kpi, idx) => {
          const isUp = kpi.trend.includes('▲');
          const isDown = kpi.trend.includes('▼');
          const trendColor = isUp ? '#10b981' : (isDown ? '#ef4444' : '#3b82f6');
          const trendBg = isUp ? 'rgba(16, 185, 129, 0.12)' : (isDown ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)');

          return (
            <div key={idx} className={styles.kpiCard}>
              <div className={styles.kpiCardTop}>
                <div className={styles.kpiIconWrapper} style={{ background: kpi.bg }}>
                  {kpi.icon}
                </div>
                <span className={styles.kpiTrendBadge} style={{ color: trendColor, background: trendBg }}>
                  {kpi.trend}
                </span>
              </div>
              <div className={styles.kpiBody}>
                <div className={styles.kpiValue}>{kpi.value}</div>
                <div className={styles.kpiTitle} title={kpi.title}>{kpi.title}</div>
                <div className={styles.kpiSubtitle} title={kpi.subtitle}>{kpi.subtitle}</div>
              </div>
            </div>
          );
        })}
      </motion.div>

      <div className={styles.mainGrid}>
        
        {/* ROW 2: Crime Trend (70%) + AI Situation Report (30%) */}
        <motion.div className={`${styles.card} ${styles.chartCol}`} variants={itemVariants}>
          <div className={styles.cardHeader}>
            <TrendingUp size={18} color="#3b82f6" />
            <h3 className={styles.cardTitle}>Crime Trend Analytics (30 Days)</h3>
          </div>
          <div className={styles.cardContent}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.crimeTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '12px', color: '#1e293b' }} />
                <Area type="monotone" dataKey="cases" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCases)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className={`${styles.card} ${styles.aiBriefCol}`} variants={itemVariants}>
          <div className={styles.cardHeader}>
            <Bot size={18} color="#8b5cf6" />
            <h3 className={styles.cardTitle}>AI Situation Report</h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.aiBriefText}>
              {data.aiBrief || "AI Engine is synchronizing with Catalyst data sources..."}
            </div>
          </div>
        </motion.div>

        {/* ROW 3: Live FIR Feed + Priority Alerts */}
        <motion.div className={`${styles.card} ${styles.feedCol}`} variants={itemVariants}>
          <div className={styles.cardHeader}>
            <Activity size={18} color="#10b981" />
            <h3 className={styles.cardTitle}>Live FIR Feed</h3>
          </div>
          <div className={styles.cardContent} style={{ padding: 0 }}>
            <div className={styles.tableWrap}>
              <table className={styles.casesTable}>
                <thead>
                  <tr>
                    <th>FIR No.</th>
                    <th>Station</th>
                    <th>Officer</th>
                    <th>Status</th>
                    <th>Risk</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.recentCases || []).map((c, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: '#3b82f6' }}>{c.crimeNo}</td>
                      <td>{c.station}</td>
                      <td>{c.officer}</td>
                      <td>
                        <span className={styles.badge} style={{ backgroundColor: `${getStatusColor(c.status)}26`, color: getStatusColor(c.status) }}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <span className={styles.badge} style={{ backgroundColor: `${getRiskColor(c.risk)}26`, color: getRiskColor(c.risk) }}>
                          {c.risk}
                        </span>
                      </td>
                      <td style={{ color: '#64748b' }}>{String(c.time).substring(0,10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        <motion.div className={`${styles.card} ${styles.alertsCol}`} variants={itemVariants}>
          <div className={styles.cardHeader}>
            <Bell size={18} color="#f59e0b" />
            <h3 className={styles.cardTitle}>Priority Alerts</h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.alertList}>
              {(data.alerts || []).map((alert, idx) => {
                const color = alert.severity === 'Critical' ? '#ef4444' : alert.severity === 'Warning' ? '#f59e0b' : '#10b981';
                return (
                  <div key={idx} className={styles.alertItem} style={{ borderLeftColor: color }}>
                    <div className={styles.alertIcon}><AlertTriangle size={16} color={color} /></div>
                    <div className={styles.alertDetails}>
                      <div className={styles.alertTitle}>
                        <span style={{ color, marginRight: '6px' }}>●</span>
                        {alert.type}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginTop: '2px' }}>{alert.title}</div>
                      <div className={styles.alertMessage}>{alert.message}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* ROW 4: District Crime + Officer Workload + Relationship Snapshot */}
        <motion.div className={`${styles.card} ${styles.distCol}`} variants={itemVariants}>
          <div className={styles.cardHeader}>
            <Map size={18} color="#06b6d4" />
            <h3 className={styles.cardTitle}>District Distribution</h3>
          </div>
          <div className={styles.cardContent}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.districtDistribution || []} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(148,163,184,0.2)" />
                <XAxis type="number" hide />
                <YAxis dataKey="district" type="category" axisLine={false} tickLine={false} fontSize={11} stroke="#475569" width={70} />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '12px', color: '#1e293b' }} />
                <Bar dataKey="cases" radius={[0, 4, 4, 0]} barSize={16}>
                  {(data.districtDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className={`${styles.card} ${styles.officerCol}`} variants={itemVariants}>
          <div className={styles.cardHeader}>
            <Shield size={18} color="#6366f1" />
            <h3 className={styles.cardTitle}>Officer Workload & AI Score</h3>
          </div>
          <div className={styles.cardContent}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.officerWorkload || []} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} stroke="#475569" />
                <YAxis axisLine={false} tickLine={false} fontSize={11} stroke="#475569" />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '12px', color: '#1e293b' }} />
                <Bar dataKey="assigned" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} barSize={24} name="Assigned FIRs" />
                <Bar dataKey="pending" stackId="a" fill="#ef4444" name="Pending Charges" />
                <Bar dataKey="completed" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className={`${styles.card} ${styles.graphCol}`} variants={itemVariants}>
          <div className={styles.cardHeader}>
            <Target size={18} color="#8b5cf6" />
            <h3 className={styles.cardTitle}>Evidence Distribution</h3>
          </div>
          <div className={styles.cardContent} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={160}>
                {(() => {
                    const radarData = [
                        { subject: 'Digital', A: data.evidenceProgress?.digital || 0, fullMark: 100 },
                        { subject: 'Physical', A: data.evidenceProgress?.forensics || 0, fullMark: 100 },
                        { subject: 'Testimonial', A: data.evidenceProgress?.witnesses || 0, fullMark: 100 },
                        { subject: 'Financial', A: data.evidenceProgress?.financial || 0, fullMark: 100 },
                        { subject: 'Forensic', A: data.evidenceProgress?.forensics || 0, fullMark: 100 }
                    ];
                    return (
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="rgba(148,163,184,0.2)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                            <Radar name="Evidence" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                        </RadarChart>
                    );
                })()}
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ROW 5: Evidence + Timeline + AI Recommendations */}
        <motion.div className={`${styles.card} ${styles.progressCol}`} variants={itemVariants}>
          <div className={styles.cardHeader}>
            <CheckSquare size={18} color="#10b981" />
            <h3 className={styles.cardTitle}>Evidence Completion</h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.progressList}>
              {[
                { label: 'Victim Statements', value: data.evidenceProgress?.victims || 0, color: '#3b82f6' },
                { label: 'Witness Statements', value: data.evidenceProgress?.witnesses || 0, color: '#f59e0b' },
                { label: 'Forensics', value: data.evidenceProgress?.forensics || 0, color: '#ef4444' },
                { label: 'Digital Evidence', value: data.evidenceProgress?.digital || 0, color: '#06b6d4' },
                { label: 'Charge Sheet', value: data.evidenceProgress?.chargeSheet || 0, color: '#8b5cf6' }
              ].map((p, idx) => (
                <div key={idx} className={styles.progressItem}>
                  <div className={styles.progressHeader}>
                    <span>{p.label}</span>
                    <span style={{ color: p.color }}>{p.value}%</span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <motion.div 
                      className={styles.progressBarFill} 
                      style={{ background: p.color }} 
                      initial={{ width: 0 }}
                      animate={{ width: `${p.value}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div className={`${styles.card} ${styles.timelineCol}`} variants={itemVariants}>
          <div className={styles.cardHeader}>
            <Clock size={18} color="#f59e0b" />
            <h3 className={styles.cardTitle}>Investigation Timeline</h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.timelineList}>
              {(data.recentTimeline || []).map((t, idx) => (
                <div key={idx} className={styles.timelineItem}>
                  <div className={styles.timelineLine} />
                  <div className={styles.timelineDot} style={{ background: t.type === 'ARREST' ? '#ef4444' : (t.type === 'COURT' ? '#10b981' : '#3b82f6') }} />
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineTime}>{t.time}</div>
                    <div className={styles.timelineDesc}>{t.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div className={`${styles.card} ${styles.recoCol}`} variants={itemVariants}>
          <div className={styles.cardHeader}>
            <Target size={18} color="#38bdf8" />
            <h3 className={styles.cardTitle}>AI Recommendations</h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.recoList}>
              {(data.aiRecommendations || []).map((reco, idx) => (
                <div key={idx} className={styles.recoItem}>
                  <CheckSquare size={16} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div className={styles.recoDetails}>
                    <div className={styles.recoTitle}>{reco.title}</div>
                    <div className={styles.recoTags}>
                      <span className={styles.recoTag} style={{ background: reco.priority === 'High' ? '#fee2e2' : '#fef3c7', color: reco.priority === 'High' ? '#ef4444' : '#f59e0b' }}>
                        {reco.priority} Priority
                      </span>
                      <span className={styles.recoTag} style={{ background: '#dcfce7', color: '#10b981' }}>
                        {reco.confidence}% Conf.
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>

      {/* BOTTOM SECTION: System Health */}
      <motion.div className={styles.healthBar} variants={itemVariants}>
        <div className={styles.healthItem}>
          <div className={styles.healthDot} /> Catalyst Serverless Ready
        </div>
        <div className={styles.healthItem}>
          <Bot size={14} color="#10b981" /> Dual-LLM Engine Online
        </div>
        <div className={styles.healthItem}>
          <Database size={14} color="#10b981" /> Datastore Connected
        </div>
        <div className={styles.healthItem}>
          <Server size={14} color="#64748b" /> {data.systemHealth?.casesIndexed || data.kpis?.totalCases || 0} Cases Indexed
        </div>
        <div className={styles.healthItem}>
          <Clock size={14} color="#64748b" /> Sync: {data.systemHealth?.lastSync || 'Live'}
        </div>
        <div className={styles.healthItem}>
          <TerminalSquare size={14} color="#64748b" /> API: {data.systemHealth?.apiLatency || 'Operational'}
        </div>
        <div className={styles.healthItem}>
          <Cpu size={14} color="#64748b" /> Runtime: Serverless Node.js V8
        </div>
      </motion.div>


    </motion.div>
  );
};

export default Dashboard;
