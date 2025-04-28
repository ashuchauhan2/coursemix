"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

type Attribute = 'class' | 'data-theme' | 'data-mode';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: string;
  storageKey?: string;
  themes?: string[];
  forcedTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  attribute?: Attribute | Attribute[];
}

/**
 * Provider component that wraps the application to provide theme context
 * Uses next-themes library to manage theme state and persistence
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem 
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
} 