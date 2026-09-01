import React, { useEffect, useState } from 'react';
import { Users, AlertTriangle, Database, FileSearch, PieChart, BarChart as BarChartIcon } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import api from '../services/api';
import AIAssistantPanel from '../components/AIAssistantPanel';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const SociologicalInsights = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await api.get('/intelligence/sociological/demographics');
      if (res.data.success) {
        setData(res.data);
      } else {
        throw new Error(res.data.error || 'Failed to fetch sociological data');
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
          <Users size={48} color="#3b82f6" />
        </motion.div>
        <div style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Aggregating Sociological Intelligence...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
        <AlertTriangle size={48} color="#ef4444" />
        <div style={{ marginTop: '16px', color: '#ef4444' }}>{error || 'Data unavailable.'}</div>
      </div>
    );
  }

  const isInsufficient = data.status === "INSUFFICIENT_DATA";

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto' }}>
      <div>
        <h1 className="page-title">Sociological Crime Insights</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Deterministic demographic and temporal analysis of recorded offenses.</p>
      </div>

      <AIAssistantPanel 
        title="Intelligence Scope" 
        content="This module aggregates actual demographic data from the Catalyst Datastore. It does not infer missing values or create predictive demographic models."
        delay={200}
      />

      {/* Data Transparency Banner */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '12px 20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Database size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Source:</strong> {data.evidence?.dataset?.join(', ') || 'Catalyst Datastore'}
            </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileSearch size={16} color="#10b981" />
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Records analyzed:</strong> {data.evidence?.records_analyzed || 0}
            </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BarChartIcon size={16} color="#8b5cf6" />
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Method:</strong> {data.method || 'Deterministic Aggregation'}
            </span>
        </div>
      </div>

      {isInsufficient ? (
        <div style={{ padding: '40px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <AlertTriangle size={32} color="#f59e0b" style={{ marginBottom: '12px' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>INSUFFICIENT DATA</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            {data.message} This module requires at least {data.evidence?.records_required} verified records to generate a statistically relevant analysis.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          
          {/* Age Distribution */}
          <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={18} color="#3b82f6" /> Age Group Distribution
            </h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.data.ageDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="group" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  <Bar dataKey="percentage" name="Percentage %" radius={[4, 4, 0, 0]}>
                    {data.data.ageDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
              * Observed pattern based strictly on {data.evidence?.records_analyzed} available records.
            </div>
          </div>

          {/* Gender Distribution */}
          <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#10b981" /> Gender Distribution
            </h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.data.genderDistribution} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="category" type="category" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  <Bar dataKey="percentage" name="Percentage %" fill="#10b981" radius={[0, 4, 4, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
              * Recorded distribution, does not infer missing values.
            </div>
          </div>

          {/* Occupation - Insufficient Data Card */}
          <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px dashed var(--border-color)', opacity: 0.8, gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>Occupation Analysis</h3>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <AlertTriangle size={24} color="#f59e0b" />
              <div>
                <strong style={{ color: '#f59e0b', display: 'block', marginBottom: '4px' }}>INSUFFICIENT DATA</strong>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {data.data.occupationDistribution?.message || "The underlying dataset does not contain sufficient verified values to generate this insight."}
                </span>
              </div>
            </div>
          </div>

          {/* Limitations Banner */}
          <div style={{ gridColumn: '1 / -1', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '8px' }}>
            <strong style={{ color: '#ef4444', fontSize: '13px', display: 'block', marginBottom: '8px' }}>LIMITATIONS & CONSTRAINTS</strong>
            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              {data.limitations?.map((limit, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{limit}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SociologicalInsights;
