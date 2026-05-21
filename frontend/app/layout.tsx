import type { Metadata } from 'next'
import { Inter, Work_Sans, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const workSans = Work_Sans({ subsets: ['latin'], variable: '--font-work-sans' })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' })

export const metadata: Metadata = {
  title: 'OMARA EMR',
  description: 'Sistem Rekam Medis Elektronik',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={`${inter.variable} ${workSans.variable} ${plusJakarta.variable}`} suppressHydrationWarning>
      <head>
        {/* Material Symbols Outlined — used throughout the OMARA design system */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className={`font-sans antialiased ${workSans.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
