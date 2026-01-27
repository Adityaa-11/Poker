import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { PokerProvider } from '@/contexts/poker-context'
import { AuthProvider } from '@/contexts/auth-context'
import { MobileNav } from '@/components/mobile-nav'
import { PWAPrompt } from '@/components/pwa-prompt'
import { OnboardingWrapper } from '@/components/onboarding-wrapper'
import { DevMenu } from '@/components/dev-menu'
import { ServiceWorkerRegister } from '@/components/service-worker-register'
import { ErrorBoundaryWrapper } from '@/components/error-boundary'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'PokerPals - Track Your Poker Games',
  description: 'Track your poker games, manage groups, and settle up with friends',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PokerPals',
  },
  icons: {
    icon: '/placeholder-logo.png',
    apple: '/placeholder-logo.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PokerPals" />
        <link rel="apple-touch-icon" href="/placeholder-logo.png" />
        <link rel="icon" href="/placeholder-logo.png" />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundaryWrapper>
            <AuthProvider>
              <PokerProvider>
                <OnboardingWrapper>
                  <main className="pb-16 md:pb-0 md:ml-64">
                    {children}
                  </main>
                  <MobileNav />
                  <PWAPrompt />
                  <DevMenu />
                  <ServiceWorkerRegister />
                </OnboardingWrapper>
              </PokerProvider>
            </AuthProvider>
          </ErrorBoundaryWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
