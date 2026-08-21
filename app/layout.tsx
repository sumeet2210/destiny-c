import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { ToastProvider } from '@/components/ui/Toast';
import { MobileTabBar } from '@/components/features/SiteNav';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'Destiny — where NITW eats',
    template: '%s · Destiny',
  },
  description:
    'Live offers, events and menus from restaurants around NIT Warangal. Decide where to eat, fast.',
};

export const viewport: Viewport = {
  themeColor: '#101010',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* This root layout supplies the font stylesheet to every App Router page. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Manrope:wght@500;600;700;800&family=Roboto+Slab:wght@700;800&display=swap"
        />
      </head>
      <body className="bg-canvas text-paper font-body flex min-h-full flex-col">
        <ToastProvider>
          <div className="min-h-full w-full pb-[calc(6rem+env(safe-area-inset-bottom))]">
            {children}
          </div>
          <MobileTabBar />
        </ToastProvider>
      </body>
    </html>
  );
}
