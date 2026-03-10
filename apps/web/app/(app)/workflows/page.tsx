'use client';

export default function WorkflowsPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <style>{`
        @keyframes comingSoonIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div
        style={{
          textAlign: 'center',
          padding: '80px 24px',
          animation: 'comingSoonIn 0.5s ease both',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,0,0,0.03)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#BBB"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83" />
          </svg>
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 300,
            color: '#1A1A1A',
            fontFamily: 'var(--font-outfit)',
            letterSpacing: '-0.03em',
            marginBottom: 8,
            marginTop: 0,
          }}
        >
          Workflow Assembler
        </h1>

        <p
          style={{
            fontSize: 14,
            color: '#999',
            fontFamily: 'var(--font-body)',
            margin: '0 0 24px',
            lineHeight: 1.6,
            maxWidth: 400,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Chain multiple agents together into automated workflows.
          Describe what you want to automate and we&apos;ll assemble the team.
        </p>

        {/* Coming Soon badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 18px',
            borderRadius: 20,
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,0,0,0.04)',
            marginBottom: 32,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: '#F59E0B',
            }}
          />
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: '#888',
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.02em',
            }}
          >
            Coming Soon
          </span>
        </div>

        {/* Feature preview list */}
        <div
          style={{
            background: 'rgba(255,255,255,0.5)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.6)',
            borderRadius: 16,
            padding: '24px 28px',
            textAlign: 'left',
            maxWidth: 440,
            margin: '0 auto',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#AAA',
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 14,
            }}
          >
            What&apos;s planned
          </div>
          {[
            'Natural language workflow builder',
            'Multi-agent orchestration with data flow',
            'Schedule-based and webhook triggers',
            'Cost estimation and usage tracking',
            'One-click activation',
          ].map((feature) => (
            <div
              key={feature}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                borderBottom: '1px solid rgba(0,0,0,0.02)',
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  background: 'rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#CCC"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span
                style={{
                  fontSize: 13,
                  color: '#666',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
