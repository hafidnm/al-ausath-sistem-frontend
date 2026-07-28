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
  title: {
    default: 'Pesantren Al-Ausath - Sistem Informasi Akademik dan Administrasi',
    template: '%s | Pesantren Al-Ausath',
  },
  description: 'Sistem e-Rapor digital untuk pesantren. Kelola nilai santri dengan mudah dan efisien.',
  generator: 'v0.app',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
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
