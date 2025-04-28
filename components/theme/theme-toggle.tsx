"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

/**
 * Toggle button component for switching between light and dark modes
 * Displays sun icon for light mode and moon icon for dark mode
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch by only rendering after component is mounted
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={`w-9 h-9 flex items-center justify-center ${className}`}>
        <span className="sr-only">Toggle theme</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      className={`w-9 h-9 flex items-center justify-center rounded-md p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
} 