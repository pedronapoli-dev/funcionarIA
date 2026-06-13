import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { SITE_URL } from '@/lib/constants'

const inter = Inter({ subsets: ['latin'] })

const title = 'educar-se-ia — Planos de estudo com IA'
const description = 'Transforme sua ementa em um plano de estudos personalizado em menos de 60 segundos.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
    locale: 'pt_BR',
    siteName: 'educar-se-ia',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        <Navbar />
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
