import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/common/Button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <Button
        variant={theme === 'light' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => setTheme('light')}
        className="h-8 w-8 p-0"
        title="Tema claro"
      >
        <Sun className="h-4 w-4" />
      </Button>

      <Button
        variant={theme === 'dark' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => setTheme('dark')}
        className="h-8 w-8 p-0"
        title="Tema escuro"
      >
        <Moon className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          // Detectar preferência do sistema e aplicar
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          setTheme(prefersDark ? 'dark' : 'light')
          // Remover preferência salva para seguir sistema
          localStorage.removeItem('invistto-theme')
        }}
        className="h-8 w-8 p-0"
        title="Seguir sistema"
      >
        <Monitor className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function SimpleThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-9 w-9 p-0"
      title={theme === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro'}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  )
}