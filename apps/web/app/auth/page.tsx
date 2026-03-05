'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth';

/* ─── OAuth Button ─── */
function OAuthButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      padding: "11px 0", borderRadius: 10, border: "1px solid rgba(0,0,0,0.06)",
      background: "rgba(255,255,255,0.6)", cursor: "pointer",
      fontSize: 13, fontWeight: 550, color: "#444", fontFamily: "var(--font-body), 'DM Sans', sans-serif",
      transition: "all 0.15s ease",
    }}
    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = "rgba(255,255,255,0.85)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = "rgba(255,255,255,0.6)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "translateY(0)"; }}>
      {icon}
      {label}
    </button>
  );
}

/* ─── Input Field ─── */
function InputField({ label, type = "text", placeholder, value, onChange, autoFocus = false }: { label: string; type?: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; autoFocus?: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#AAA", fontFamily: "var(--font-body), 'DM Sans', sans-serif", letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: 6 }}>{label}</label>
      <input
        type={type} placeholder={placeholder} value={value} onChange={onChange} autoFocus={autoFocus}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14,
          fontFamily: "var(--font-body), 'DM Sans', sans-serif", color: "#1A1A1A", outline: "none",
          background: "rgba(255,255,255,0.6)",
          border: focused ? "1.5px solid rgba(0,0,0,0.12)" : "1.5px solid rgba(0,0,0,0.05)",
          transition: "all 0.15s ease", boxSizing: "border-box" as const,
        }}
      />
    </div>
  );
}

/* ─── Main ─── */
export default function AuthPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#F2F3F6" }} />}>
      <AuthPageInner />
    </Suspense>
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
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  const isSignUp = mode === "signup";

  const redirect = searchParams.get('redirect') || '/dashboard';

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error: err } = await signUp(email, password, name);
        if (err) { setError(err.message); return; }
        // If email confirmation is required, show message
        if (data?.user && !data.session) {
          setError("Check your email for a confirmation link, then sign in.");
          setMode('signin');
          return;
        }
      } else {
        const { error: err } = await signIn(email, password);
        if (err) { setError(err.message); return; }
      }
      // Small delay so Supabase cookie propagates before middleware checks
      await new Promise((r) => setTimeout(r, 300));
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", position: "relative" }}>
      <style>{`
        @keyframes a1 { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(4%,-6%) scale(1.06)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes a2 { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(-5%,5%) scale(1.05)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes a3 { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(7%,-4%) scale(1.08)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes shimmer { 0%{background-position:200% 50%} 100%{background-position:-200% 50%} }
        ::selection { background: #1A1A1A; color: white; }
        input::placeholder { color: #CCC; }
      `}</style>

      {/* ─── Left: Auth Form ─── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column" as const, justifyContent: "center", alignItems: "center",
        padding: "40px 24px", position: "relative" as const, zIndex: 2,
        background: "#F2F3F6",
      }}>
        {/* Subtle background blobs */}
        <div style={{ position: "absolute" as const, inset: 0, overflow: "hidden", zIndex: 0 }}>
          <div style={{ position: "absolute" as const, top: "-20%", left: "-15%", width: "60%", height: "60%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,160,140,0.1) 0%, transparent 60%)", animation: "a1 26s ease-in-out infinite", filter: "blur(60px)" }} />
          <div style={{ position: "absolute" as const, bottom: "-10%", right: "-10%", width: "50%", height: "50%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(130,180,255,0.08) 0%, transparent 60%)", animation: "a2 32s ease-in-out infinite", filter: "blur(60px)" }} />
          <div style={{ position: "absolute" as const, inset: 0, backgroundSize: "28px 28px", backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.02) 1px, transparent 1px)" }} />
        </div>

        <div style={{ width: "100%", maxWidth: 380, position: "relative" as const, zIndex: 1 }}>
          {/* Back button */}
          <button onClick={() => router.back()} style={{
            display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none",
            cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#BBB",
            fontFamily: "var(--font-body), 'DM Sans', sans-serif", padding: 0, marginBottom: 28,
            transition: "color 0.15s ease", animation: "fadeUp 0.5s ease both",
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.color = "#666"}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.color = "#BBB"}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>

          {/* Heading */}
          <div style={{ marginBottom: 32, animation: "fadeUp 0.5s ease both", animationDelay: "0.05s" }}>
            <h1 style={{ fontSize: 28, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em", marginBottom: 8, lineHeight: 1.2 }}>
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p style={{ fontSize: 14.5, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.5 }}>
              {isSignUp ? "Start building AI agent workflows in minutes." : "Sign in to your Agent Spark workspace."}
            </p>
          </div>

          {/* OAuth buttons */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24, animation: "fadeUp 0.5s ease both", animationDelay: "0.1s" }}>
            <OAuthButton
              label="Google"
              onClick={() => signInWithGoogle()}
              icon={<svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>}
            />
            <OAuthButton
              label="GitHub"
              onClick={() => {}}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="#333"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>}
            />
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, animation: "fadeUp 0.5s ease both", animationDelay: "0.12s" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.05)" }} />
            <span style={{ fontSize: 11, color: "#CCC", fontFamily: "var(--font-body), 'DM Sans', sans-serif", fontWeight: 500 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.05)" }} />
          </div>

          {/* Error message */}
          {error && (
            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, animation: "fadeUp 0.3s ease both" }}>
              <p style={{ fontSize: 13, color: "#EF4444", fontFamily: "var(--font-body), 'DM Sans', sans-serif", margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Form fields */}
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 16, marginBottom: 24, animation: "fadeUp 0.5s ease both", animationDelay: "0.15s" }}>
            {isSignUp && (
              <InputField label="Full name" placeholder="Jack Smith" value={name} onChange={e => setName(e.target.value)} autoFocus />
            )}
            <InputField label="Email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus={!isSignUp} />
            <InputField label="Password" type="password" placeholder={isSignUp ? "Create a password" : "Enter your password"} value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          {/* Forgot password (sign in only) */}
          {!isSignUp && (
            <div style={{ textAlign: "right" as const, marginBottom: 20, marginTop: -8, animation: "fadeUp 0.5s ease both", animationDelay: "0.17s" }}>
              <Link href="/forgot" style={{ fontSize: 12.5, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif", textDecoration: "none", fontWeight: 500, transition: "color 0.15s ease" }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.color = "#666"}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.color = "#BBB"}>Forgot password?</Link>
            </div>
          )}

          {/* Submit button */}
          <button onClick={handleSubmit} disabled={loading} style={{
            width: "100%", padding: "13px 0", borderRadius: 11, border: "none",
            background: "#1A1A1A", color: "#FFF", fontSize: 14, fontWeight: 600,
            fontFamily: "var(--font-body), 'DM Sans', sans-serif", cursor: loading ? "default" : "pointer",
            transition: "all 0.15s ease", marginBottom: 20,
            animation: "fadeUp 0.5s ease both", animationDelay: "0.2s",
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { if (!loading) { e.currentTarget.style.background = "#333"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)"; } }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = "#1A1A1A"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
            {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
          </button>

          {/* Toggle mode */}
          <p style={{ fontSize: 13.5, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif", textAlign: "center" as const, animation: "fadeUp 0.5s ease both", animationDelay: "0.22s" }}>
            {isSignUp ? "Already have an account? " : "Don\u2019t have an account? "}
            <span onClick={() => { setMode(isSignUp ? "signin" : "signup"); setPassword(""); setError(""); }}
              style={{ color: "#1A1A1A", fontWeight: 600, cursor: "pointer", transition: "opacity 0.15s ease" }}
              onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => e.currentTarget.style.opacity = "0.7"}
              onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => e.currentTarget.style.opacity = "1"}>
              {isSignUp ? "Sign in" : "Sign up"}
            </span>
          </p>

          {/* Terms (sign up only) */}
          {isSignUp && (
            <p style={{ fontSize: 11.5, color: "#CCC", fontFamily: "var(--font-body), 'DM Sans', sans-serif", textAlign: "center" as const, marginTop: 16, lineHeight: 1.5, animation: "fadeUp 0.5s ease both", animationDelay: "0.25s" }}>
              By creating an account, you agree to our{" "}
              <Link href="/terms" style={{ color: "#AAA", textDecoration: "underline", textUnderlineOffset: 2 }}>Terms of Service</Link>{" "}and{" "}
              <Link href="/privacy" style={{ color: "#AAA", textDecoration: "underline", textUnderlineOffset: 2 }}>Privacy Policy</Link>.
            </p>
          )}
        </div>
      </div>

      {/* ─── Right: Branded Panel ─── */}
      <div style={{
        width: "45%", minWidth: 400, position: "relative" as const, overflow: "hidden",
        background: "#F2F3F6", display: "flex", flexDirection: "column" as const,
        justifyContent: "center", alignItems: "center", padding: "60px 48px",
        borderLeft: "1px solid rgba(0,0,0,0.04)",
      }}>
        {/* Animated background blobs */}
        <div style={{ position: "absolute" as const, inset: 0, zIndex: 0 }}>
          <div style={{ position: "absolute" as const, top: "-15%", right: "-10%", width: "60%", height: "60%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,160,140,0.18) 0%, transparent 60%)", animation: "a1 26s ease-in-out infinite", filter: "blur(80px)" }} />
          <div style={{ position: "absolute" as const, bottom: "-10%", left: "-10%", width: "50%", height: "50%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(130,180,255,0.14) 0%, transparent 60%)", animation: "a2 32s ease-in-out infinite", filter: "blur(80px)" }} />
          <div style={{ position: "absolute" as const, top: "30%", left: "20%", width: "40%", height: "40%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(180,160,255,0.1) 0%, transparent 60%)", animation: "a3 28s ease-in-out infinite", filter: "blur(80px)" }} />
          <div style={{ position: "absolute" as const, inset: 0, backgroundSize: "28px 28px", backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.025) 1px, transparent 1px)" }} />
          <div style={{ position: "absolute" as const, inset: 0, backgroundImage: "linear-gradient(rgba(0,0,0,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.018) 1px, transparent 1px)", backgroundSize: "80px 80px", maskImage: "radial-gradient(ellipse at 50% 50%, black 20%, transparent 65%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 20%, transparent 65%)" }} />
        </div>

        {/* Content */}
        <div style={{ position: "relative" as const, zIndex: 1, maxWidth: 340, animation: "fadeUp 0.6s ease both", animationDelay: "0.15s" }}>
          {/* Decorative mini flow diagram */}
          <div style={{ marginBottom: 40, display: "flex", justifyContent: "center" }}>
            <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 14, padding: "16px 12px" }}>
              <svg width="200" height="80" viewBox="0 0 200 80">
                <defs>
                  <pattern id="authGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="0.5" fill="rgba(0,0,0,0.04)" />
                  </pattern>
                </defs>
                <rect width="200" height="80" fill="url(#authGrid)" rx="10" />
                <rect x="16" y="24" width="44" height="32" rx="8" fill="rgba(255,255,255,0.7)" stroke="rgba(0,0,0,0.05)" strokeWidth="0.8" />
                <text x="38" y="43" fontFamily="var(--font-body), DM Sans, sans-serif" fontSize="8" fontWeight="600" fill="#AAA" textAnchor="middle">Agent</text>
                <rect x="78" y="24" width="44" height="32" rx="8" fill="rgba(255,255,255,0.7)" stroke="rgba(0,0,0,0.05)" strokeWidth="0.8" />
                <text x="100" y="43" fontFamily="var(--font-body), DM Sans, sans-serif" fontSize="8" fontWeight="600" fill="#AAA" textAnchor="middle">Agent</text>
                <rect x="140" y="24" width="44" height="32" rx="8" fill="rgba(255,255,255,0.7)" stroke="rgba(0,0,0,0.05)" strokeWidth="0.8" />
                <text x="162" y="43" fontFamily="var(--font-body), DM Sans, sans-serif" fontSize="8" fontWeight="600" fill="#AAA" textAnchor="middle">Agent</text>
                <line x1="60" y1="40" x2="78" y2="40" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
                <line x1="122" y1="40" x2="140" y2="40" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
                <circle r="2" fill="rgba(26,26,26,0.18)">
                  <animateMotion dur="2s" repeatCount="indefinite" path="M 60 40 L 78 40" />
                </circle>
                <circle r="2" fill="rgba(26,26,26,0.18)">
                  <animateMotion dur="2.4s" repeatCount="indefinite" path="M 122 40 L 140 40" />
                </circle>
              </svg>
            </div>
          </div>

          <h2 style={{ fontSize: 32, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: 16, textAlign: "center" as const }}>
            Assemble AI agents<br />into workflows
          </h2>
          <p style={{ fontSize: 14.5, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.6, textAlign: "center" as const, marginBottom: 36 }}>
            Describe what you want automated. The assembler selects, connects, and deploys the right agents, no code required.
          </p>

          {/* Feature pills */}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, justifyContent: "center" }}>
            {["A2A Orchestration", "50+ Integrations", "Agent Studio", "Marketplace"].map((f, i) => (
              <span key={i} style={{
                fontSize: 11.5, fontWeight: 550, color: "#999",
                fontFamily: "var(--font-body), 'DM Sans', sans-serif",
                background: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.6)",
                borderRadius: 8, padding: "6px 14px",
              }}>{f}</span>
            ))}
          </div>
        </div>

        {/* Bottom attribution */}
        <div style={{ position: "absolute" as const, bottom: 28, left: 0, right: 0, textAlign: "center" as const, zIndex: 1 }}>
          <span style={{ fontSize: 11, color: "#CCC", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>500 free credits to start &middot; No credit card required</span>
        </div>
      </div>
    </div>
  );
}
