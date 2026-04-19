import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Notes',
  description: 'Your personal notes, always in sync',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Notes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="h-dvh overflow-hidden antialiased font-sans">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress Tiptap's internal releasePointerCapture error on mobile touch.
              const _origRPC = Element.prototype.releasePointerCapture;
              Element.prototype.releasePointerCapture = function(pointerId) {
                try { _origRPC.call(this, pointerId); } catch (e) {
                  if (!(e instanceof DOMException && e.name === 'NotFoundError')) throw e;
                }
              };

              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
