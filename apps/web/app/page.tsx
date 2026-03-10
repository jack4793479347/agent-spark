'use client';

import React, { useState, useEffect } from 'react';
import AnimatedGradientBackground from '@/components/ui/animated-gradient-background';
import { SplineScene } from '@/components/ui/splite';


export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus('success');
      } else if (res.status === 409) {
        setStatus('duplicate');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes marqueeReverse { from{transform:translateX(-50%)} to{transform:translateX(0)} }
        @keyframes slideInUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
      ` }} />

      {/* BG */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <AnimatedGradientBackground
          Breathing={true}
          animationSpeed={0.015}
          breathingRange={3}
          startingGap={130}
          topOffset={-20}
          gradientColors={['#FFFFFF', '#F0F4FF', '#E8EEFF', '#DDE6FF', '#EDE4FF', '#F5E6FF', '#FFFFFF']}
          gradientStops={[0, 25, 40, 55, 70, 85, 100]}
        />
      </div>


      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 'calc(100vh - 56px)' }}>
        <div className="flex-1 flex flex-col items-center w-full relative overflow-hidden" style={{ animation: 'fadeUp 0.6s ease both', minHeight: 'calc(100vh + 60px)' }}>

          {/* Layer 1: Sliding text rows behind the robot */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none" style={{ opacity: 0.06 }}>
            {[
              { text: 'AI AGENTS THAT CAN DO ANYTHING', dir: 'left', speed: 35 },
              { text: 'AUTOMATE  ORCHESTRATE  EXECUTE', dir: 'right', speed: 45 },
              { text: 'AI AGENTS THAT CAN DO ANYTHING', dir: 'left', speed: 40 },
              { text: 'BUILD  DEPLOY  SCALE  REPEAT', dir: 'right', speed: 50 },
              { text: 'AI AGENTS THAT CAN DO ANYTHING', dir: 'left', speed: 38 },
            ].map((row, idx) => (
              <div key={idx} className="w-[200vw] overflow-hidden whitespace-nowrap" style={{ lineHeight: 1.05 }}>
                <div style={{
                  display: 'inline-block',
                  animation: `${row.dir === 'left' ? 'marquee' : 'marqueeReverse'} ${row.speed}s linear infinite`,
                  whiteSpace: 'nowrap',
                }}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <span key={j} className="text-[14vw] sm:text-[12vw] lg:text-[10vw] font-black tracking-tighter text-foreground" style={{ marginRight: '4vw' }}>
                      {row.text}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Layer 2: 3D Agent */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-auto z-[2]"
            style={{ filter: 'brightness(3) contrast(0.7) saturate(0) drop-shadow(0 0 100px rgba(255,255,255,1))', top: '28vh' }}
          >
            <div className="relative w-[160vw] h-[145vh]" style={{ animation: 'slideInUp 1s ease 0.2s both' }}>
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Layer 3: Waitlist input — dead center */}
          <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none" style={{ animation: 'slideInUp 0.8s ease 0.6s both', paddingTop: '12vh' }}>
            <div className="w-full max-w-[480px] px-5 pointer-events-auto">
              <p className="text-center text-white text-lg font-medium tracking-tight mb-4 drop-shadow-[0_1px_8px_rgba(255,255,255,0.4)]" style={{ fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>
                Agents that can do anything.
              </p>

              {status === 'success' ? (
                <div style={{
                  animation: 'fadeUp 0.3s ease both',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: 16,
                  padding: '24px 20px',
                  border: '1px solid rgba(0,0,0,.06)',
                  boxShadow: '0 4px 24px rgba(0,0,0,.06)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 18,
                    background: '#22C55E', display: 'grid', placeItems: 'center',
                    margin: '0 auto 12px',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p style={{ fontSize: 17, fontWeight: 600, color: '#1A1A1A', marginBottom: 4 }}>
                    You&apos;re on the list!
                  </p>
                  <p style={{ fontSize: 13, color: '#555' }}>
                    We&apos;ll let you know when it&apos;s your turn.
                  </p>
                </div>
              ) : (
                <>
                  {/* Rainbow glow wrapper */}
                  <div className="relative group rounded-2xl overflow-hidden">
                    {/* Rainbow gradient bar at bottom */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[3px] animate-rainbow bg-[length:200%] bg-[linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))] z-10"
                    />
                    <form onSubmit={handleSubmit} style={{
                      display: 'flex', alignItems: 'center', gap: 0,
                      background: 'rgba(255,255,255,0.85)',
                      backdropFilter: 'blur(12px)',
                      borderRadius: 16,
                      border: '1px solid rgba(0,0,0,.06)',
                      boxShadow: '0 4px 24px rgba(0,0,0,.06)',
                      padding: '6px 6px 6px 16px',
                    }}>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                          flex: 1, padding: '10px 0',
                          border: 'none', background: 'transparent',
                          fontSize: 14, color: '#1A1A1A',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={status === 'loading'}
                        style={{
                          padding: '10px 18px', background: '#1A1A1A',
                          color: '#fff', border: 'none', borderRadius: 12,
                          fontSize: 13, fontWeight: 600,
                          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                          transition: 'all .2s', opacity: status === 'loading' ? 0.6 : 1,
                          whiteSpace: 'nowrap', flexShrink: 0,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#333'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A1A'; }}
                      >
                        {status === 'loading' ? 'Joining...' : 'Join the Waitlist'}
                      </button>
                    </form>
                  </div>
                  {status === 'duplicate' && (
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 10, textAlign: 'center', textShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                      You&apos;re already on the list!
                    </p>
                  )}
                  {status === 'error' && (
                    <p style={{ fontSize: 13, color: '#EF4444', marginTop: 10, textAlign: 'center' }}>
                      Something went wrong. Please try again.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
