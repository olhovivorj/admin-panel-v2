import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Carregar tema do localStorage ou usar preferência do sistema
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('invistto-theme') as Theme
    if (savedTheme) {
      return savedTheme
    }

    // Detectar preferência do sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }

    return 'light'
  })

  // Aplicar tema no documento
  useEffect(() => {
    const root = window.document.documentElement

    // Remover classe anterior
    root.classList.remove('light', 'dark')

    // Adicionar nova classe
    root.classList.add(theme)

    // Salvar no localStorage
    localStorage.setItem('invistto-theme', theme)
  }, [theme])

  // Escutar mudanças na preferência do sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      // Só aplicar se não há preferência salva
      const savedTheme = localStorage.getItem('invistto-theme')
      if (!savedTheme) {
        setThemeState(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider')
  }
  return context
}