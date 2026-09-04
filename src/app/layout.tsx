import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import ZyoraAiAssistant from '@/components/ai/ZyoraAiAssistant';

const serifFont = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  preload: true,
});

const sansFont = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'ZYORA — Multi-Vendor Haute Couture & Dark Luxury Fashion',
  description: 'The premier multi-vendor fashion platform for haute couture, designer outerwear, and luxury streetwear.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#faf9f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${serifFont.variable} ${sansFont.variable}`}>
      <body className="bg-ivory-100 text-onyx-900 min-h-screen antialiased overflow-x-hidden w-full max-w-full">
        <AuthProvider>
          <CartProvider>
            {children}
            <ZyoraAiAssistant />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
