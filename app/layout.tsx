import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Toaster } from '@/components/ui/toaster'

 

export const metadata: Metadata = {
  title: "Sociedade de Psicanálise de Goiânia - SPG",
  description: "Transformando vidas através da psicanálise com profissionais dedicados e experientes em Goiânia",
  generator: "v0.app",
  icons: {
    icon: "/spg1.png",
    apple: "/spg1.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`font-sans antialiased bg-black selection:bg-primary selection:text-white text-foreground flex flex-col min-h-screen`}>
        <div className="flex-1">
          {children}
        </div>
        <Analytics />
        <Toaster />
      </body>
    </html>
  )
}
