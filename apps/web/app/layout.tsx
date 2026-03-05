import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, DM_Sans, Outfit, Space_Grotesk } from 'next/font/google';
import { AuthProvider } from '@/components/providers/AuthProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['200', '300', '400', '500', '600', '700'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'Agent Spark | AI Agent Marketplace',
    template: '%s | Agent Spark',
  },
  description: 'Browse, rent, and orchestrate AI agents that automate your business workflows.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'Agent Spark | AI Agent Marketplace',
    description: 'Browse, rent, and orchestrate AI agents that automate your business workflows.',
    type: 'website',
    siteName: 'Agent Spark',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agent Spark | AI Agent Marketplace',
    description: 'Browse, rent, and orchestrate AI agents that automate your business workflows.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable} ${dmSans.variable} ${outfit.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen antialiased" style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', 'DM Sans', sans-serif" }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
