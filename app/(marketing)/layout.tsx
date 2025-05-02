import type { Metadata } from "next";
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

interface MarketingLayoutProps {
   children: React.ReactNode
}
 
export const metadata: Metadata = {
   title: "Blaze Conversion Assistant",
   description: "Local File Conversions & RAG-based AI Unit Conversions",
};

export default function MarketingLayout({
   children,
}: MarketingLayoutProps) {
   return (
      <div className="flex flex-col h-screen font-cabinet-grotesk antialiased overflow-hidden">
         <SiteHeader />
         <main className="flex-1 overflow-hidden">
            {children}
         </main>
         <SiteFooter />
      </div>
   )
}
