import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        heading: ['var(--font-inter)', 'var(--font-heading)', 'Inter', 'Plus Jakarta Sans', 'sans-serif'],
        body: ['var(--font-inter)', 'var(--font-body)', 'Inter', 'DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        bg: {
          primary: '#FFFFFF',
          secondary: '#F2F3F6',
          tertiary: '#EBEDF2',
        },
        surface: {
          glass: 'rgba(255, 255, 255, 0.45)',
          'glass-border': 'rgba(255, 255, 255, 0.5)',
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#777777',
          tertiary: '#ABABAB',
        },
        /* Original indigo accent — used by dashboard, creator, agent detail */
        accent: {
          primary: '#6366F1',
          'primary-hover': '#4F46E5',
          secondary: '#8B5CF6',
        },
        /* Monochrome tokens — used by landing page + marketplace */
        spark: {
          primary: '#1A1A1A',
          'primary-hover': '#333333',
          muted: '#888888',
          faint: '#CCCCCC',
          surface: 'rgba(255, 255, 255, 0.58)',
          'surface-hover': 'rgba(255, 255, 255, 0.78)',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.03)',
        md: '0 2px 8px rgba(0, 0, 0, 0.03), 0 4px 16px rgba(0, 0, 0, 0.04)',
        lg: '0 8px 48px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      spacing: {
        'card-padding': '24px',
        'section-gap': '48px',
        'page-margin': '40px',
      },
      backdropBlur: {
        glass: '28px',
      },
      animation: {
        spotlight: 'spotlight 2s ease .75s 1 forwards',
        rainbow: 'rainbow var(--speed, 2s) infinite linear',
      },
      keyframes: {
        spotlight: {
          '0%': { opacity: '0', transform: 'translate(-72%, -62%) scale(0.5)' },
          '100%': { opacity: '1', transform: 'translate(-50%,-40%) scale(1)' },
        },
        rainbow: {
          '0%': { 'background-position': '0%' },
          '100%': { 'background-position': '200%' },
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: (utilities: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.bg-conic': {
          'background-image': 'conic-gradient(var(--tw-gradient-stops))',
        },
      });
    },
  ],
};

export default config;
