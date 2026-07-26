import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      await signup(email, password, name);
      setSuccess('Account created successfully! You can now sign in.');
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
    } catch (err) {
      setError('Registration unable to complete at this time.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.glassCard}>
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <div style={styles.logoMark}>V</div>
          </div>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Join VIKSHANA workspace</p>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}
        {success && <div style={styles.successAlert}>{success}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <div style={styles.inputWrapper}>
              <User style={styles.inputIcon} size={20} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                placeholder="Officer Name"
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail style={styles.inputIcon} size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="officer@vikshana.gov"
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock style={styles.inputIcon} size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="••••••••"
                minLength="8"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <div style={styles.inputWrapper}>
              <Lock style={styles.inputIcon} size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={styles.input}
                placeholder="••••••••"
                minLength="8"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.primaryButton}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/auth/login" style={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0b10',
    backgroundImage: 'radial-gradient(circle at 50% 0%, #1a1e36 0%, #0a0b10 70%)',
    fontFamily: "'Inter', 'Roboto', sans-serif",
  },
  glassCard: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px',
    backgroundColor: 'rgba(20, 22, 33, 0.7)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  logoMark: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#ffffff',
    boxShadow: '0 10px 20px rgba(139, 92, 246, 0.3)',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: 0,
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  successAlert: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    color: '#22c55e',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#cbd5e1',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: '#64748b',
  },
  input: {
    width: '100%',
    padding: '12px 16px 12px 48px',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '15px',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxSizing: 'border-box',
  },
  eyeButton: {
    position: 'absolute',
    right: '16px',
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#3b82f6',
    backgroundImage: 'linear-gradient(to right, #3b82f6, #6366f1)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.1s ease, box-shadow 0.2s ease',
    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
    marginTop: '8px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '32px',
    fontSize: '14px',
    color: '#94a3b8',
  },
  link: {
    color: '#60a5fa',
    textDecoration: 'none',
    fontWeight: '500',
  }
};

export default Signup;
