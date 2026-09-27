import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import BottomNav from '@/components/navigation/BottomNav'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'
import ServiceWorkerRegistrar from '@/components/pwa/ServiceWorkerRegistrar'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'AXIS — Precision Compass',
  description: 'Ultra-premium offline compass and navigation instrument.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AXIS',
  },
}

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="h-full flex flex-col"
        style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}
      >
        <ServiceWorkerRegistrar />
        <OnboardingFlow>
          <main
            className="flex-1 flex flex-col overflow-hidden"
            style={{ paddingBottom: '4rem' }}
          >
            {children}
          </main>
          <BottomNav />
        </OnboardingFlow>
      </body>
    </html>
  )
}
