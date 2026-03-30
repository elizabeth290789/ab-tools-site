import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'A/B Test Toolkit',
  description: 'Tools for running better experiments.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
