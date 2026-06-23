import React from "react"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import { ReactQueryProvider } from '@/components/react-query-provider'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: 'e-Rapor Pesantren - Sistem Penilaian Digital',
  description: 'Sistem e-Rapor digital untuk pesantren. Kelola nilai santri dengan mudah dan efisien.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} ${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <ReactQueryProvider>
          {children}
          <Analytics />
          <Toaster />
        </ReactQueryProvider>
      </body>
    </html>
  )
}
