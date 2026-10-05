import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { authService } from '../services/authService';
import './Auth.css';

export default function Signup() {
  const { navigate, setRole } = useAppContext();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setError('You must agree to the Terms of Service to continue.');
      return;
    }

    setLoading(true);

    try {
      // Backend should force role to 'driver' regardless of what we send, 
      // but we explicitly do not send a role field to match the requirement: "Signup cannot choose a role."
      await authService.register({ name, email, password });
      
      // On success, either login or go to login page. 
      // Mocking auto-login for development testability as a driver.
      setRole('driver');
      navigate('DriverDashboard');
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
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

          <h1 className="auth-title" style={{ fontSize: 28 }}>Create your account</h1>
          <p className="auth-subtitle">Find parking, reserve your spot, and keep your plans in one place.</p>

          {error && (
            <div className="auth-error-message" role="alert">
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label" htmlFor="name">Full name</label>
              <input 
                id="name"
                type="text" 
                className="auth-input"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>

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
              <label className="auth-label" htmlFor="password">Password</label>
              <div className="auth-input-container">
                <input 
                  id="password"
                  type={showPassword ? 'text' : 'password'} 
                  className="auth-input"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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

            <div className="auth-field">
              <label className="auth-label" htmlFor="confirmPassword">Confirm password</label>
              <div className="auth-input-container">
                <input 
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'} 
                  className="auth-input"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button 
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 8 }}>
              <input 
                type="checkbox" 
                id="terms" 
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                style={{ marginTop: 4, width: 16, height: 16, accentColor: 'var(--color-green)' }}
              />
              <label htmlFor="terms" style={{ fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                I agree to the <a href="#" className="auth-link" onClick={(e) => e.preventDefault()}>Terms of Service</a> and <a href="#" className="auth-link" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
              </label>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto', animation: 'spin 1s linear infinite' }} /> : 'Create account'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <a href="#" className="auth-link" onClick={(e) => { e.preventDefault(); navigate('Login'); }}>Sign in</a>
          </div>
          
          <button 
            className="auth-link" 
            style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--color-muted)' }}
            onClick={() => navigate('LandingPage')}
          >
            <ArrowLeft size={14} /> Back to landing page
          </button>
        </div>

        {/* Visual Side */}
        <div className="auth-visual-side signup-visual hidden md:flex" style={{ display: 'none' }}>
          <div style={{ position: 'absolute', top: '10%', right: '-20%', width: '400px', height: '400px', background: 'radial-gradient(circle, var(--color-green) 0%, transparent 70%)', opacity: 0.3, borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }}></div>
          <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--color-bright) 0%, transparent 70%)', opacity: 0.15, borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }}></div>
          
          <div style={{ width: '100%', maxWidth: 360, zIndex: 10 }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
              {[
                { title: 'Real-time availability', desc: 'Stop circling blocks looking for an open spot.' },
                { title: 'Instant reservations', desc: 'Secure your parking before you even leave.' },
                { title: 'Flexible check-in', desc: 'Running late? Grace periods included.' }
              ].map((feature, i) => (
                <li key={i} style={{ display: 'flex', gap: 16 }}>
                  <div style={{ color: 'var(--color-bright)', marginTop: 2 }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{feature.title}</div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{feature.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
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
