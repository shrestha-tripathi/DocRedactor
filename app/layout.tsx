import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ServiceWorkerRegistration from '@/components/common/ServiceWorkerRegistration';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DocRedactor - Privacy-First Document Redaction',
  description: 'Automatically detect and redact PII from your documents. All processing happens locally - your files never leave your device.',
  keywords: ['redaction', 'privacy', 'PII', 'GDPR', 'HIPAA', 'document', 'PDF'],
  authors: [{ name: 'DocRedactor Team' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
