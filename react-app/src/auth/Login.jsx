import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { Eye, EyeOff, Mail, Lock, User, CheckCircle2, X } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals state (In-App overlays)
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  
  const { login, signup, loginWithGoogle, forgotPassword, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password, rememberMe);
      navigate(from, { replace: true });
    } catch (err) {
      setError('Authentication unsuccessful. Please verify credentials.');
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demo) => {
    setError('');
    setLoading(true);
    let pwd = 'password123';
    if (demo.email === 'admin@vikshana.ai') pwd = 'admin123';
    else if (demo.email === 'investigator@vikshana.ai') pwd = 'investigator123';
    else if (demo.email === 'analyst@vikshana.ai') pwd = 'analyst123';
    else if (demo.email === 'supervisor@vikshana.ai') pwd = 'supervisor123';
    else if (demo.email === 'policymaker@vikshana.ai') pwd = 'policy123';

    try {
      await login(demo.email, pwd, true);
      navigate(from, { replace: true });
    } catch (err) {
      setError('Demo environment is syncing, please try again.');
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError('');

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters long.');
      return;
    }

    setSignupLoading(true);
    try {
      await signup(signupName, signupEmail, signupPassword, signupConfirmPassword);
      setShowSignupModal(false);
      navigate(from, { replace: true });
    } catch (err) {
      setSignupError('Registration unable to complete at this time.');
      setSignupLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const msg = await forgotPassword(forgotEmail);
      setForgotMsg(msg);
      setForgotLoading(false);
    } catch (err) {
      setForgotMsg(`Reset link sent to ${forgotEmail}`);
      setForgotLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      setError('External authentication service unavailable.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.glassCard}>
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <div style={styles.logoMark}>V</div>
          </div>
          <h1 style={styles.title}>VIKSHANA</h1>
          <p style={styles.subtitle}>Sign in to your workspace</p>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}
        {successMsg && <div style={styles.successAlert}>{successMsg}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username / Email</label>
            <div style={styles.inputWrapper}>
              <Mail style={styles.inputIcon} size={20} />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="e.g. admin@vikshana.ai"
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

          <div style={styles.optionsGroup}>
            <label style={styles.rememberMe}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              style={styles.linkButton}
            >
              Forgot Password?
            </button>
          </div>

          <button type="submit" disabled={loading} style={styles.primaryButton}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerLine}></span>
          <span style={styles.dividerText}>Demo Accounts</span>
          <span style={styles.dividerLine}></span>
        </div>

        <div style={styles.demoAccountsContainer}>
          {[
            { label: 'Administrator', email: 'admin@vikshana.ai', role: 'Administrator' },
            { label: 'Investigator', email: 'investigator@vikshana.ai', role: 'Investigator' },
            { label: 'Analyst', email: 'analyst@vikshana.ai', role: 'Analyst' },
            { label: 'Supervisor', email: 'supervisor@vikshana.ai', role: 'Supervisor' },
            { label: 'Policymaker', email: 'policymaker@vikshana.ai', role: 'Policymaker' }
          ].map((demo) => (
            <button
              key={demo.email}
              type="button"
              onClick={() => handleDemoLogin(demo)}
              style={styles.demoAccountButton}
            >
              <div style={styles.demoAccountLabel}>{demo.label}</div>
              <div style={styles.demoAccountRole}>{demo.role}</div>
            </button>
          ))}
        </div>

        <div style={styles.divider}>
          <span style={styles.dividerLine}></span>
          <span style={styles.dividerText}>or continue with</span>
          <span style={styles.dividerLine}></span>
        </div>

        <button onClick={handleGoogleLogin} style={styles.googleButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '10px' }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <p style={styles.footer}>
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => setShowSignupModal(true)}
            style={styles.linkButton}
          >
            Sign up here
          </button>
        </p>
      </div>

      {/* IN-APP SIGNUP MODAL */}
      {showSignupModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '18px' }}>Create Catalyst Officer Account</h3>
              <button onClick={() => setShowSignupModal(false)} style={styles.closeBtn}>
                <X size={18} color="#94a3b8" />
              </button>
            </div>

            {signupError && <div style={styles.errorAlert}>{signupError}</div>}

            <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name</label>
                <div style={styles.inputWrapper}>
                  <User style={styles.inputIcon} size={18} />
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    style={styles.input}
                    placeholder="Officer Kanishk"
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <div style={styles.inputWrapper}>
                  <Mail style={styles.inputIcon} size={18} />
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    style={styles.input}
                    placeholder="officer@vikshana.gov"
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <div style={styles.inputWrapper}>
                  <Lock style={styles.inputIcon} size={18} />
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    style={styles.input}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Confirm Password</label>
                <div style={styles.inputWrapper}>
                  <Lock style={styles.inputIcon} size={18} />
                  <input
                    type="password"
                    required
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    style={styles.input}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button type="submit" disabled={signupLoading} style={styles.primaryButton}>
                {signupLoading ? 'Creating Account...' : 'Create Account & Sign In'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* IN-APP FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '18px' }}>Reset Password</h3>
              <button onClick={() => setShowForgotModal(false)} style={styles.closeBtn}>
                <X size={18} color="#94a3b8" />
              </button>
            </div>

            {forgotMsg ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 12px' }} />
                <div style={{ color: '#ffffff', fontSize: '14px', marginBottom: '16px' }}>{forgotMsg}</div>
                <button onClick={() => setShowForgotModal(false)} style={styles.primaryButton}>
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Enter registered email address</label>
                  <div style={styles.inputWrapper}>
                    <Mail style={styles.inputIcon} size={18} />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      style={styles.input}
                      placeholder="officer@vikshana.gov"
                    />
                  </div>
                </div>

                <button type="submit" disabled={forgotLoading} style={styles.primaryButton}>
                  {forgotLoading ? 'Sending Reset Link...' : 'Send Password Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
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
    letterSpacing: '1px',
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    color: '#10b981',
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
  optionsGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
  },
  rememberMe: {
    display: 'flex',
    alignItems: 'center',
    color: '#94a3b8',
    cursor: 'pointer',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#60a5fa',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    padding: 0,
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
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    padding: '0 12px',
    fontSize: '13px',
    color: '#64748b',
  },
  demoAccountsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  demoAccountButton: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: '#cbd5e1',
  },
  demoAccountLabel: {
    fontSize: '14px',
    fontWeight: '600',
  },
  demoAccountRole: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  googleButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    color: '#334155',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease',
  },
  footer: {
    textAlign: 'center',
    marginTop: '32px',
    fontSize: '14px',
    color: '#94a3b8',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#141621',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    padding: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0
  }
};

export default Login;
