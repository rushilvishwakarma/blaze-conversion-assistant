"use client"

import React, { useEffect, useState } from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export default function ThemeToggleButton() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Only show the UI when mounted on the client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className="rounded-full w-9 p-0 h-9 relative"
      name="Theme Toggle Button"
    >
      {mounted ? (
        theme === "dark" ? (
          <MoonIcon className="size-[1.2rem]" />
        ) : (
          <SunIcon className="size-[1.2rem]" />
        )
      ) : (
        // Render an empty placeholder with the same dimensions to prevent layout shift
        <div className="size-[1.2rem]" />
      )}
      <span className="sr-only">Theme Toggle</span>
    </Button>
  )
}
