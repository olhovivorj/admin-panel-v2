import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401) {
          return false
        }
        return failureCount < 2
      },
    },
  },
})

// Função para remover o loader inicial e mostrar a aplicação
function initializeApp() {
  const root = document.getElementById('root')!
  const initialLoader = document.getElementById('initial-loader')

  // Renderizar a aplicação
  ReactDOM.createRoot(root).render(
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>,
  )

  // Remover o loader inicial com fade out após a renderização
  if (initialLoader) {
    // Aguardar um frame para garantir que o React renderizou
    requestAnimationFrame(() => {
      initialLoader.classList.add('fade-out')
      // Remover completamente após a transição
      setTimeout(() => {
        initialLoader.remove()
      }, 300)
    })
  }
}

// Inicializar imediatamente quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp)
} else {
  initializeApp()
}