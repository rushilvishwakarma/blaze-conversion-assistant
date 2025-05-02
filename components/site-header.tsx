'use client'
import ThemeToggleButton from "@/components/ui/theme-toggle-button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileType, Calculator } from "lucide-react"

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'

export function SiteHeader() {
   const router = useRouter()
   const pathname = usePathname()
   const [currentTab, setCurrentTab] = useState('account')

   type TabsConfig = {
      [key: string]: { path: string; label: string; icon: React.ReactNode }
   }

   const tabsConfig: TabsConfig = useMemo(() => ({
      account: { 
         path: '/', 
         label: 'File Conversion Tool',
         icon: <FileType className="size-4" />
      },
      password: { 
         path: '/conversion-chat', 
         label: 'Conversion Tool',
         icon: <Calculator className="size-4" />
      },
   }), [])

   const handleTabChange = (value: string) => {
      const tab = tabsConfig[value]
      if (tab) {
         router.push(tab.path)
      }
   }

   useEffect(() => {
      const currentPath = Object.entries(tabsConfig).find(([, tab]) => tab.path === pathname)
      setCurrentTab(currentPath ? currentPath[0] : 'account')
   }, [pathname, tabsConfig])

   return (
      <header className="w-full bg-background z-20 border-b px-5 py-2 shadow-sm h-14">
         <div className="flex items-center justify-between mx-auto h-full">
            <div className="hidden md:block">
               <Link className="text-sm font-semibold" href="/">
                  <Image
                     src="/flame.svg"
                     alt="Blaze Conversion Assistant"
                     className="text-primary size-8"
                     width={40}
                     height={40}
                  />
               </Link>
            </div>
            
            <div className="flex items-center">
               <ThemeToggleButton />
            </div>
         </div>
      </header>
   )
}
