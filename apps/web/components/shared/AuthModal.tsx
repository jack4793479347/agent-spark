'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/supabase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultMode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, onSuccess, defaultMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp, signInWithGoogle } = useAuth();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setEmail('');
      setPassword('');
      setFullName('');
      setError('');
      setLoading(false);
    }
  }, [isOpen, defaultMode]);

  // When user becomes authenticated while modal is open, fire onSuccess
  useEffect(() => {
    if (isOpen && user) {
      onSuccess?.();
      onClose();
    }
  }, [user, isOpen, onSuccess, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setError(error.message);
          return;
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
          return;
        }
      }
      // Auth state change listener in useAuth will update user → triggers the useEffect above
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
    }
    // Google OAuth redirects — onSuccess handled on return via auth state change
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    fontSize: 14,
    color: '#1A1A1A',
    background: 'rgba(255,255,255,0.5)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1.5px solid rgba(255,255,255,0.7)',
    borderRadius: 10,
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ animation: 'fadeIn 0.15s ease' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full mx-4"
        style={{
          maxWidth: 420,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.7)',
          borderRadius: 20,
          padding: '36px 32px 32px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.03)',
          animation: 'cardIn 0.25s ease both',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute flex items-center justify-center"
          style={{
            top: 16,
            right: 16,
            width: 28,
            height: 28,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: '#BBB',
            fontSize: 18,
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
            e.currentTarget.style.color = '#888';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#BBB';
          }}
        >
          &times;
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          {/* Logo icon */}
          <div
            className="inline-flex items-center justify-center mb-4"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#1A1A1A',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
            </svg>
          </div>
          <h2
            className="m-0 mb-1.5"
            style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.03em' }}
          >
            Sign in to Agent Spark
          </h2>
          <p className="m-0" style={{ fontSize: 14, color: '#999' }}>
            Create an account to rent agents and build AI teams
          </p>
        </div>

        {/* Google OAuth — primary action */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3"
          style={{
            padding: '12px 16px',
            fontSize: 14,
            fontWeight: 600,
            color: '#1A1A1A',
            background: '#FFF',
            border: '1.5px solid #E5E5E5',
            borderRadius: 11,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FAFAFA';
            e.currentTarget.style.borderColor = '#D0D0D0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFF';
            e.currentTarget.style.borderColor = '#E5E5E5';
          }}
        >
          {/* Google G icon */}
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1" style={{ height: 1, background: 'rgba(0,0,0,0.06)' }} />
          <span style={{ fontSize: 12, color: '#CCC', fontWeight: 500 }}>or</span>
          <div className="flex-1" style={{ height: 1, background: 'rgba(0,0,0,0.06)' }} />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              required
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)')}
            />
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)')}
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? 'Password (min 8 characters)' : 'Password'}
            required
            minLength={mode === 'signup' ? 8 : 1}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)')}
          />

          {error && (
            <p className="m-0" style={{ fontSize: 13, color: '#EF4444' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="spark-btn w-full"
            style={{
              fontSize: 14,
              fontWeight: 600,
              padding: '12px 20px',
              borderRadius: 10,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              marginTop: 2,
            }}
          >
            {loading
              ? 'Please wait...'
              : mode === 'signin'
                ? 'Sign In'
                : 'Create Account'}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="text-center m-0 mt-5" style={{ fontSize: 13.5, color: '#999' }}>
          {mode === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => { setMode('signup'); setError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1A1A1A',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 13.5,
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => { setMode('signin'); setError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1A1A1A',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 13.5,
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
