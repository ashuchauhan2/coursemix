"use client"

import * as React from "react"
import { ThemeToggle } from "./theme-toggle"

export function FixedThemeToggle() {
  return (
    <div className="fixed bottom-4 left-4 z-40 hidden md:block animate-fade-in">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg p-1.5 hover:scale-105 transition-transform">
        <ThemeToggle className="hover:bg-gray-100/90 dark:hover:bg-gray-700/90" />
      </div>
    </div>
  )
}

// Add this to your globals.css or create animation in the tailwind.config.js
// @keyframes fade-in {
//   from { opacity: 0; transform: translateY(10px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// 
// .animate-fade-in {
//   animation: fade-in 0.5s ease-out forwards;
// } 