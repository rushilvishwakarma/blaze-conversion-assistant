import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              Blaze Conversion Assistant
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
            An AI Assistant for learning unit conversion and local file conversion
            </p>
          </div>
          <div className="space-x-4">
            <Link href="/conversion-chat">
              <Button size="lg">
                Try Conversion Chat
              </Button>
            </Link>

          </div>
        </div>
      </div>
    </section>
  )
}