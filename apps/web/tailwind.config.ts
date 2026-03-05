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
    },
  },
  plugins: [],
};

export default config;
