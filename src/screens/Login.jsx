import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { authService } from '../services/authService';
import './Auth.css';

export default function Login() {
  const { navigate, setRole, setUser } = useAppContext();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail.endsWith('@parkease.com')) {
      setError('Only @parkease.com email addresses are allowed.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authService.login(email, password);
      // Success - redirect based on role
      const userRole = result.user.role;
      setUser(result.user);
      setRole(userRole);
      let targetScreen = 'DriverDashboard';
      if (userRole === 'ADMIN' || userRole === 'admin') targetScreen = 'AdminDashboard';
      else if (userRole === 'OPERATOR' || userRole === 'operator') targetScreen = 'OperatorDashboard';
      navigate(targetScreen);
    } catch (err) {
      setError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  // Dev only override
  const handleDevBypass = (role) => {
    setRole(role);
    navigate(role === 'operator' ? 'OperatorDashboard' : 'DriverDashboard');
  };

  return (
    <div className="auth-wrapper selection:bg-mint selection:text-forest">
      <motion.div 
        className="auth-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        
        {/* Form Side */}
        <div className="auth-form-side">
          <div className="auth-brand" onClick={() => navigate('LandingPage')}>
            <div className="w-8 h-8 rounded-full bg-green flex items-center justify-center text-white" style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'var(--color-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Car size={16} />
            </div>
            <span>ParkEase</span>
          </div>

          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue to ParkEase.</p>

          {error && (
            <div className="auth-error-message" role="alert">
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">Email address</label>
              <input 
                id="email"
                type="email" 
                className="auth-input"
                placeholder="name@parkease.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="auth-label" htmlFor="password">Password</label>
                <a href="#" className="auth-link" style={{ fontSize: 13 }} onClick={(e) => e.preventDefault()}>Forgot password?</a>
              </div>
              <div className="auth-input-container">
                <input 
                  id="password"
                  type={showPassword ? 'text' : 'password'} 
                  className="auth-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button 
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto', animation: 'spin 1s linear infinite' }} /> : 'Sign in'}
            </button>
          </form>

          <div className="auth-footer">
            New to ParkEase? <a href="#" className="auth-link" onClick={(e) => { e.preventDefault(); navigate('Signup'); }}>Create an account</a>
          </div>
          
          <button 
            className="auth-link" 
            style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--color-muted)' }}
            onClick={() => navigate('LandingPage')}
          >
            <ArrowLeft size={14} /> Back to landing page
          </button>

          {/* Dev Bypass */}
          <div className="dev-bypass-panel">
            <div className="dev-bypass-title">Development Only: Bypass Login</div>
            <div className="dev-bypass-buttons">
              <button className="dev-bypass-btn" onClick={() => handleDevBypass('driver')}>
                Login as Driver
              </button>
              <button className="dev-bypass-btn" onClick={() => handleDevBypass('operator')}>
                Login as Operator
              </button>
            </div>
          </div>
        </div>

        {/* Visual Side */}
        <div className="auth-visual-side hidden md:flex" style={{ display: 'none' }}>
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, var(--color-bright) 0%, transparent 70%)', opacity: 0.4, borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }}></div>
          <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--color-green) 0%, transparent 70%)', opacity: 0.2, borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }}></div>
          
          <div style={{ width: '100%', maxWidth: 360, zIndex: 10 }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 20, border: '1px solid rgba(36, 159, 104, 0.2)', boxShadow: '0 20px 40px -10px rgba(16, 36, 27, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, borderBottom: '1px solid var(--color-muted)', paddingBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-green)' }}>
                  <Car size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>Arriving at Central</div>
                  <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>Spot A04 reserved</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                <div style={{ width: '100%', height: 8, borderRadius: 4, backgroundColor: 'var(--color-surface)' }}>
                  <div style={{ width: '60%', height: '100%', borderRadius: 4, backgroundColor: 'var(--color-green)' }}></div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'right' }}>ETA: 12 mins</div>
              </div>
            </div>
            
            <h2 style={{ fontSize: 32, fontWeight: 700, marginTop: 48, lineHeight: 1.2 }}>
              Your parking is already planned.
            </h2>
          </div>
        </div>
      </motion.div>
      <style>{`
        @media (min-width: 768px) {
          .auth-visual-side.hidden { display: flex !important; }
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
