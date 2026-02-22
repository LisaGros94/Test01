import type { Metadata, Viewport } from 'next';
import './globals.css';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'Clarity — Your financial life, made legible',
  description: 'A wealth intelligence platform for the seriously complex. AI-driven signals, tax optimisation, and proactive action — built for founders and operators with €1M–€15M in net worth.',
  openGraph: {
    title: 'Clarity',
    description: 'Your financial life, made legible.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#F8FAFC',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
