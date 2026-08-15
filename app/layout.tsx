import type { Metadata, Viewport } from 'next';
import { Roboto_Slab, Inter, JetBrains_Mono, Manrope } from 'next/font/google';
import { ToastProvider } from '@/components/ui/Toast';
import { MobileTabBar } from '@/components/features/SiteNav';
import './globals.css';

const robotoSlab = Roboto_Slab({
  variable: '--font-roboto-slab',
  subsets: ['latin'],
  weight: ['700', '800'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
});

const manrope = Manrope({
  variable: '--font-destiny',
  subsets: ['latin'],
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
  themeColor: '#2B2B2B',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${robotoSlab.variable} ${inter.variable} ${jetbrainsMono.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="bg-canvas text-paper font-body flex min-h-full flex-col">
        <ToastProvider>
          <div className="min-h-full w-full pb-[calc(4.25rem+env(safe-area-inset-bottom))]">
            {children}
          </div>
          <MobileTabBar />
        </ToastProvider>
      </body>
    </html>
  );
}
