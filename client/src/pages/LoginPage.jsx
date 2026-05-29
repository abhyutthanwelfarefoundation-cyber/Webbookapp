import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdMenuBook } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Min 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid email or password';
      setLoginError(message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f1f5f9',
      fontFamily: 'Inter, sans-serif',
      padding: 16
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .login-inp { transition: border-color 0.2s, box-shadow 0.2s; }
        .login-inp:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); outline: none; }
        .login-btn:hover { background: linear-gradient(135deg,#4f46e5,#7c3aed) !important; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,0.35) !important; }
        .login-btn:active { transform: translateY(0); }
        .login-btn { transition: all 0.2s; }
      `}</style>

     <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: 880,
          display: 'grid',
          gridTemplateColumns: window.innerWidth < 640 ? '1fr' : '1fr 1fr',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.15)',
        }}
      >
       {/* LEFT — Brand panel — hidden on mobile */}
        <div style={{
          background: 'linear-gradient(160deg,#1e1b4b 0%,#312e81 40%,#4c1d95 100%)',
          padding: 48,
          display: window.innerWidth < 640 ? 'none' : 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 520
        }}>
          {/* Decorative orbs */}
          <div style={{ position: 'absolute', width: 300, height: 300, background: 'rgba(139,92,246,0.15)', borderRadius: '50%', top: -80, right: -80, filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 200, height: 200, background: 'rgba(99,102,241,0.1)', borderRadius: '50%', bottom: -60, left: -60, filter: 'blur(40px)', pointerEvents: 'none' }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
            <div style={{
              width: 44, height: 44,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)'
            }}>
              <MdMenuBook size={24} color="#fff" />
            </div>
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 600, letterSpacing: 0.3 }}>BookPresent</span>
          </div>

          {/* Main content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Floating book illustration */}
            <div style={{
              width: 100, height: 100,
              background: 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.2))',
              borderRadius: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 28,
              animation: 'float 3s ease-in-out infinite',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)'
            }}>
              <MdMenuBook size={52} color="rgba(255,255,255,0.8)" />
            </div>

            <h1 style={{
              color: '#fff',
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1.3,
              marginBottom: 14
            }}>
              Present books<br />
              <span style={{
                background: 'linear-gradient(135deg,#a78bfa,#60a5fa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                like never before
              </span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7 }}>
              The digital catalog for publisher agents.<br />
              Browse, present and impress — anywhere.
            </p>
          </div>

          {/* Feature badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 1 }}>
            {[
              { icon: '🔒', text: 'Secure & encrypted login' },
              { icon: '📶', text: 'Works offline in villages' },
              { icon: '📱', text: 'Tablet & mobile optimised' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>{f.icon}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Form panel */}
        <div style={{
          background: '#fff',
          padding: window.innerWidth < 640 ? 28 : 48,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: window.innerWidth < 640 ? '100vh' : 'auto'
        }}>
          <div style={{ marginBottom: 32 }}>
            {/* Mobile logo — only shown when left panel hidden */}
            {window.innerWidth < 640 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{
                  width: 40, height: 40,
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <MdMenuBook size={22} color="#fff" />
                </div>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>BookPresent</span>
              </div>
            )}
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
              Welcome back 👋
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280' }}>
              Sign in to access your book catalog
            </p>
          </div>

          {/* Error */}
          <AnimatePresence mode="wait">
            {loginError && (    
              <motion.div
                key="err"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  background: '#FEF2F2',
                  border: '1.5px solid #FECACA',
                  borderRadius: 12,
                  padding: '12px 16px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,  
                  overflow: 'hidden'
                }}
              >
                <span style={{ fontSize: 18 }}>⚠️</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: '#DC2626', fontSize: 14 }}>Login Failed</p>
                  <p style={{ margin: '2px 0 0', color: '#EF4444', fontSize: 13 }}>{loginError}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 7 }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <MdEmail size={18} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  className="login-inp"
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  autoComplete="email"
                  onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setLoginError(''); }}
                  style={{
                    width: '100%', border: `1.5px solid ${errors.email ? '#F87171' : '#E5E7EB'}`,
                    borderRadius: 12, padding: '12px 16px 12px 42px',
                    fontSize: 14, fontFamily: 'inherit', color: '#1F2937',
                    background: '#FAFAFA', boxSizing: 'border-box'
                  }}
                />
              </div>
              {errors.email && <p style={{ margin: '5px 0 0', fontSize: 12, color: '#EF4444' }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 7 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <MdLock size={18} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  className="login-inp"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  autoComplete="current-password"
                  onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setLoginError(''); }}
                  style={{
                    width: '100%', border: `1.5px solid ${errors.password ? '#F87171' : '#E5E7EB'}`,
                    borderRadius: 12, padding: '12px 44px 12px 42px',
                    fontSize: 14, fontFamily: 'inherit', color: '#1F2937',
                    background: '#FAFAFA', boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                    color: '#9CA3AF', display: 'flex', alignItems: 'center'
                  }}
                >
                  {showPass ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </button>
              </div>
              {errors.password && <p style={{ margin: '5px 0 0', fontSize: 12, color: '#EF4444' }}>{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="login-btn"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#A5B4FC' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                border: 'none', borderRadius: 12, padding: '14px 0',
                color: '#fff', fontSize: 15, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 16px rgba(99,102,241,0.3)'
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Signing in...
                </>
              ) : 'Sign in to continue →'}
            </button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #F3F4F6', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>
              Don't have an account? Contact your admin
            </p>
          </div>
        </div>
      </motion.div>

      {/* Mobile fallback */}
      <style>{`
        @media (max-width: 640px) {
          .login-grid { grid-template-columns: 1fr !important; }
          .login-left { display: none !important; }
        }
      `}</style>
    </div>
  );
}