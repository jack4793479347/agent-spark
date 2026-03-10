'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth';
import { PublicShell } from '@/components/layout/PublicShell';

const fontBody = "var(--font-body), 'DM Sans', sans-serif";
const fontHeading = "var(--font-outfit), 'Outfit', sans-serif";

/* ─── OAuth Button ─── */
function OAuthButton({ icon, label, onClick, delay }: { icon: React.ReactNode; label: string; onClick: () => void; delay: number }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      padding: "11px 0", borderRadius: 9, border: "1px solid rgba(0,0,0,0.05)",
      background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)",
      cursor: "pointer", fontSize: 13, fontWeight: 550, color: "#444", fontFamily: fontBody,
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      animation: `authSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms both`,
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.85)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.55)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
      {icon}
      {label}
    </button>
  );
}

/* ─── Input Field ─── */
function InputField({ label, type = "text", placeholder, value, onChange, autoFocus = false, delay = 0 }: {
  label: string; type?: string; placeholder: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; autoFocus?: boolean; delay?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ animation: `authSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms both` }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 600, color: "#AAA", fontFamily: fontBody,
        letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: 6,
      }}>{label}</label>
      <input
        type={type} placeholder={placeholder} value={value} onChange={onChange} autoFocus={autoFocus}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "11px 14px", borderRadius: 9, fontSize: 13.5,
          fontFamily: fontBody, color: "#1A1A1A", outline: "none",
          background: focused ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.5)",
          border: focused ? "1.5px solid rgba(0,0,0,0.12)" : "1.5px solid rgba(0,0,0,0.04)",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", boxSizing: "border-box" as const,
          boxShadow: focused ? "0 0 0 3px rgba(0,0,0,0.03)" : "none",
        }}
      />
    </div>
  );
}

/* ─── Success Overlay ─── */
function SuccessOverlay() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "#F2F3F6",
      animation: "authFadeIn 0.3s ease both",
    }}>
      <div style={{ animation: "authScaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, background: "#1A1A1A",
          display: "grid", placeItems: "center", margin: "0 auto 20px",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 24, strokeDashoffset: 24, animation: "authCheckDraw 0.4s ease 0.4s forwards" }} />
          </svg>
        </div>
      </div>
      <div style={{ animation: "authSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both" }}>
        <p style={{ fontSize: 18, fontWeight: 400, color: "#1A1A1A", fontFamily: fontHeading, letterSpacing: "-0.02em", margin: "0 0 6px", textAlign: "center" }}>
          Welcome to Agent Spark
        </p>
        <p style={{ fontSize: 13.5, color: "#999", fontFamily: fontBody, textAlign: "center", margin: 0 }}>
          Setting up your workspace...
        </p>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function AuthPage() {
  return (
    <PublicShell>
      <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
        <AuthPageInner />
      </Suspense>
    </PublicShell>
  );
}

function AuthPageInner() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [switching, setSwitching] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  const isSignUp = mode === "signup";

  const redirect = searchParams.get('redirect') || '/dashboard';

  const handleModeSwitch = () => {
    setSwitching(true);
    setTimeout(() => {
      setMode(isSignUp ? "signin" : "signup");
      setPassword("");
      setError("");
      setSwitching(false);
    }, 200);
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error: err } = await signUp(email, password, name);
        if (err) { setError(err.message); return; }
        if (data?.user && !data.session) {
          setError("Check your email for a confirmation link, then sign in.");
          setMode('signin');
          return;
        }
      } else {
        const { error: err } = await signIn(email, password);
        if (err) { setError(err.message); return; }
      }
      // Show success animation before redirecting
      setSuccess(true);
      await new Promise((r) => setTimeout(r, 1200));
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Keyboard submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) handleSubmit();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", position: "relative", zIndex: 1 }} onKeyDown={handleKeyDown}>
      <style>{`
        @keyframes authSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes authFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes authScaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes authCheckDraw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes authSwitchOut {
          to { opacity: 0; transform: translateY(-8px); }
        }
        @keyframes authPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes authFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes authBarGrow {
          from { width: 0; }
        }
        @keyframes authFlowDot {
          0% { transform: translateY(0); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateY(13px); opacity: 0; }
        }
        ::selection { background: #1A1A1A; color: white; }
        input::placeholder { color: #CCC; }
      `}</style>

      {success && <SuccessOverlay />}

      {/* ─── Left: Auth Form ─── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        padding: "40px 24px", position: "relative", zIndex: 2,
      }}>

        <div style={{
          width: "100%", maxWidth: 380, position: "relative", zIndex: 1,
          opacity: switching ? 0 : 1,
          transform: switching ? "translateY(-8px)" : "translateY(0)",
          transition: "all 0.2s ease",
        }}>
          {/* Back button */}
          <button onClick={() => router.back()} style={{
            display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none",
            cursor: "pointer", fontSize: 12.5, fontWeight: 500, color: "#CCC",
            fontFamily: fontBody, padding: 0, marginBottom: 32,
            transition: "color 0.15s ease",
            animation: "authSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#888"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#CCC"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>

          {/* Heading */}
          <div style={{ marginBottom: 28, animation: "authSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) 40ms both" }}>
            <h1 style={{ fontSize: 26, fontWeight: 300, color: "#1A1A1A", fontFamily: fontHeading, letterSpacing: "-0.03em", marginBottom: 6, lineHeight: 1.2 }}>
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p style={{ fontSize: 13.5, color: "#999", fontFamily: fontBody, lineHeight: 1.5, margin: 0 }}>
              {isSignUp ? "Start building AI agent workflows in minutes." : "Sign in to your Agent Spark workspace."}
            </p>
          </div>

          {/* OAuth buttons */}
          <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
            <OAuthButton
              label="Google"
              delay={80}
              onClick={() => signInWithGoogle()}
              icon={<svg width="15" height="15" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>}
            />
            <OAuthButton
              label="GitHub"
              delay={120}
              onClick={() => {}}
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="#333"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>}
            />
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22, animation: "authSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) 140ms both" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.04)" }} />
            <span style={{ fontSize: 10.5, color: "#CCC", fontFamily: fontBody, fontWeight: 500, letterSpacing: "0.05em" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.04)" }} />
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)",
              borderRadius: 9, padding: "10px 14px", marginBottom: 16,
              animation: "authScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
            }}>
              <p style={{ fontSize: 12.5, color: "#EF4444", fontFamily: fontBody, margin: 0, lineHeight: 1.4 }}>{error}</p>
            </div>
          )}

          {/* Form fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 22 }}>
            {isSignUp && (
              <InputField label="Full name" placeholder="Jack Smith" value={name} onChange={e => setName(e.target.value)} autoFocus delay={160} />
            )}
            <InputField label="Email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus={!isSignUp} delay={isSignUp ? 200 : 160} />
            <InputField label="Password" type="password" placeholder={isSignUp ? "Create a password" : "Enter your password"} value={password} onChange={e => setPassword(e.target.value)} delay={isSignUp ? 240 : 200} />
          </div>

          {/* Forgot password (sign in only) */}
          {!isSignUp && (
            <div style={{ textAlign: "right", marginBottom: 18, marginTop: -6, animation: "authSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) 220ms both" }}>
              <Link href="/forgot" style={{ fontSize: 12, color: "#CCC", fontFamily: fontBody, textDecoration: "none", fontWeight: 500, transition: "color 0.15s ease" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#888"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#CCC"}>Forgot password?</Link>
            </div>
          )}

          {/* Submit button */}
          <button onClick={handleSubmit} disabled={loading} style={{
            width: "100%", padding: "12px 0", borderRadius: 9, border: "none",
            background: "#1A1A1A", color: "#FFF", fontSize: 13.5, fontWeight: 600,
            fontFamily: fontBody, cursor: loading ? "default" : "pointer",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", marginBottom: 20,
            animation: `authSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${isSignUp ? 280 : 240}ms both`,
            opacity: loading ? 0.7 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
          onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "#333"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"; } }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#1A1A1A"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
            {loading && (
              <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "authPulse 0.8s ease infinite", flexShrink: 0 }}>
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: "2px solid transparent", borderTopColor: "white", animation: "spin 0.5s linear infinite" }} />
              </div>
            )}
            {loading ? (isSignUp ? "Creating account..." : "Signing in...") : isSignUp ? "Create Account" : "Sign In"}
          </button>

          {/* Toggle mode */}
          <p style={{
            fontSize: 13, color: "#BBB", fontFamily: fontBody, textAlign: "center", margin: 0,
            animation: `authSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${isSignUp ? 320 : 260}ms both`,
          }}>
            {isSignUp ? "Already have an account? " : "Don\u2019t have an account? "}
            <span onClick={handleModeSwitch}
              style={{ color: "#1A1A1A", fontWeight: 600, cursor: "pointer", transition: "opacity 0.15s ease" }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.6"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
              {isSignUp ? "Sign in" : "Sign up"}
            </span>
          </p>

          {/* Terms (sign up only) */}
          {isSignUp && (
            <p style={{
              fontSize: 11, color: "#CCC", fontFamily: fontBody, textAlign: "center",
              marginTop: 16, lineHeight: 1.5,
              animation: "authSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) 360ms both",
            }}>
              By creating an account, you agree to our{" "}
              <Link href="/terms" style={{ color: "#AAA", textDecoration: "underline", textUnderlineOffset: 2 }}>Terms</Link>{" "}and{" "}
              <Link href="/privacy" style={{ color: "#AAA", textDecoration: "underline", textUnderlineOffset: 2 }}>Privacy Policy</Link>.
            </p>
          )}
        </div>
      </div>

      {/* ─── Right: Branded Panel ─── */}
      <div className="hidden lg:flex" style={{
        width: "45%", minWidth: 400, position: "relative", overflow: "hidden",
        flexDirection: "column",
        justifyContent: "center", alignItems: "center", padding: "60px 48px",
        borderLeft: "1px solid rgba(0,0,0,0.03)",
      }}>

        {/* Orchestration story */}
        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 320 }}>

          {/* User prompt bubble */}
          <div style={{
            background: "#1A1A1A", borderRadius: 12, borderBottomLeftRadius: 4,
            padding: "12px 16px", marginBottom: 20, maxWidth: 240,
            animation: "authSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 150ms both",
          }}>
            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.9)", fontFamily: fontBody, margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
              &ldquo;Launch my newsletter — research trending topics, write 3 posts, and schedule them.&rdquo;
            </p>
          </div>

          {/* Orchestrator response */}
          <div style={{
            fontSize: 11.5, color: "#999", fontFamily: fontBody, marginBottom: 16, paddingLeft: 2,
            animation: "authSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 300ms both",
          }}>
            Assembling 3 agents...
          </div>

          {/* Agent chain */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { icon: "search", label: "Research Agent", desc: "Found 12 trending topics in your niche", delay: 400 },
              { icon: "edit", label: "Content Writer", desc: "Drafted 3 SEO-optimized posts", delay: 550 },
              { icon: "send", label: "Scheduler Agent", desc: "Queued for Mon, Wed, Fri at 9am", delay: 700 },
            ].map((agent, i) => (
              <div key={i}>
                {/* Connecting line */}
                {i > 0 && (
                  <div style={{
                    width: 1, height: 16, background: "rgba(0,0,0,0.06)", marginLeft: 19,
                    animation: `authFadeIn 0.3s ease ${agent.delay - 80}ms both`,
                  }}>
                    <div style={{
                      width: 3, height: 3, borderRadius: "50%", background: "rgba(0,0,0,0.1)",
                      marginLeft: -1,
                      animation: `authFlowDot 1.5s ease-in-out ${agent.delay}ms infinite`,
                    }} />
                  </div>
                )}
                {/* Agent card */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                  background: "rgba(255,255,255,0.5)", backdropFilter: "blur(12px)",
                  border: "1px solid rgba(0,0,0,0.03)", borderRadius: 11,
                  animation: `authSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${agent.delay}ms both`,
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, background: "rgba(0,0,0,0.03)",
                    display: "grid", placeItems: "center", flexShrink: 0,
                  }}>
                    {agent.icon === "search" && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    )}
                    {agent.icon === "edit" && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    )}
                    {agent.icon === "send" && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1A1A1A", fontFamily: fontBody, marginBottom: 2 }}>{agent.label}</div>
                    <div style={{ fontSize: 11, color: "#999", fontFamily: fontBody, lineHeight: 1.4 }}>{agent.desc}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </div>
            ))}
          </div>

          {/* Result summary */}
          <div style={{
            marginTop: 20, padding: "14px 16px",
            background: "rgba(255,255,255,0.5)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(0,0,0,0.03)", borderRadius: 11,
            animation: "authSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 900ms both",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, background: "#1A1A1A", display: "grid", placeItems: "center" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", fontFamily: fontBody }}>Done in 45 seconds</span>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { value: "3", label: "agents" },
                { value: "12", label: "sources" },
                { value: "3", label: "posts" },
              ].map((s, i) => (
                <div key={i}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", fontFamily: fontHeading }}>{s.value}</span>
                  <span style={{ fontSize: 10.5, color: "#BBB", fontFamily: fontBody, marginLeft: 3 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tagline */}
          <div style={{ textAlign: "center", marginTop: 28, animation: "authSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 1000ms both" }}>
            <p style={{ fontSize: 13, color: "#999", fontFamily: fontBody, lineHeight: 1.5, margin: 0 }}>
              One prompt. Multiple agents. Real results.
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ position: "absolute", bottom: 28, left: 0, right: 0, textAlign: "center", zIndex: 1, animation: "authFadeIn 0.5s ease 1200ms both" }}>
          <span style={{ fontSize: 11, color: "#CCC", fontFamily: fontBody }}>50 free tasks &middot; No credit card needed</span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
