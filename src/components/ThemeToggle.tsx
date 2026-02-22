'use client'

import { useTheme } from './ThemeProvider'

interface ThemeToggleProps {
  compact?: boolean
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        className="flex items-center justify-center w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xl"
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? '🌙' : '☀️'}
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
      </span>
      <div
        className={`relative w-11 h-6 rounded-full transition-colors ${
          theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </div>
    </button>
  )
}
