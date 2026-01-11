import { createContext, useContext, useEffect, type ReactNode } from 'react'
import type { ThemeType } from '../types'

interface ThemeContextType {
  setTheme: (theme: ThemeType) => void
  clearTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const setTheme = (theme: ThemeType) => {
    document.body.classList.remove('organic', 'machinic')
    if (theme) {
      document.body.classList.add(theme)
    }
  }

  const clearTheme = () => {
    document.body.classList.remove('organic', 'machinic')
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('organic', 'machinic')
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ setTheme, clearTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
