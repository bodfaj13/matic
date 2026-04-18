import type { Metadata } from 'next';
import { Lato } from 'next/font/google';

import { Providers } from '@/components/providers';

import './globals.css';

const lato = Lato({
  variable: '--font-sans-app',
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'Smart Triage',
  description: 'Support ticket intake and LLM-assisted triage for agents.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lato.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
