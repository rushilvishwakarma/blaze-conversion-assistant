import type { Metadata } from 'next'
import { Inter as FontSans } from 'next/font/google'
import localFont from 'next/font/local'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import '@/styles/globals.css'

const fontSans = FontSans({
   subsets: ['latin'],
   variable: '--font-sans',
})

const cabinetGrotesk = localFont({
   src: '../public/CabinetGrotesk-Variable.ttf',
   display: 'swap',
   variable: '--font-cabinet-grotesk',
})

export const metadata: Metadata = {
   title: 'Blaze Conversion Assistant',
   description: 'Locally convert between different files formats, units and measurements.',
}

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode
}>) {
   return (
      <html lang="en" suppressHydrationWarning>
         <head>
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content="#000000" />
            <meta name="description" content="A tool for local file conversion" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
         </head>
         <body
            className={cn(
               'bg-background min-h-screen font-cabinet-grotesk antialiased',
               fontSans.variable,
               cabinetGrotesk.variable,
            )}
         >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            {children}
            <Toaster />
          </ThemeProvider>
         </body>
      </html>
   )
}
