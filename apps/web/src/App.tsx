import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { AuthProvider } from '@invistto/auth-react'
import { BaseProvider } from '@/contexts/BaseContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { Layout } from '@/components/layout/Layout'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Users } from '@/pages/users/Users'
import { Bases } from '@/pages/Bases'
import { Roles } from '@/pages/Roles'
import { Apps } from '@/pages/Apps'
import { Pages } from '@/pages/Pages'
import { Plans } from '@/pages/Plans'
import { Schedules } from '@/pages/Schedules'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

/**
 * Componente interno que tem acesso ao useNavigate e queryClient
 */
function AppRoutes() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  return (
    <AuthProvider
      apiUrl=""
      tokenKey="@ari:token"
      userKey="@ari:user"
      useSessionStorage={false}
      useCookies={true}
      validateOnLoad={true}
      loginEndpoint="/auth/login"
      refreshEndpoint="/auth/refresh"
      validateEndpoint="/auth/validate"
      logoutEndpoint="/auth/logout"
      onLogin={(user) => {
        // Salvar baseId para requisições
        if (user.baseId) {
          localStorage.setItem('@ari:selectedBaseId', user.baseId.toString())
        }
        if (user.base) {
          localStorage.setItem('@ari:selectedBase', user.base)
        }
        toast.success('Login realizado com sucesso!')
        navigate('/dashboard')
      }}
      onLogout={() => {
        // Limpar dados locais
        localStorage.clear()
        // Limpar cache do React Query
        qc.clear()
        // Navegar para login (fallback quando não veio do Hub)
        // O AuthProvider já redireciona para o Hub se veio de lá (logout_redirect)
        navigate('/login')
      }}
    >
      <BaseProvider>
        <SidebarProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="usuarios-api" element={<Navigate to="/users" replace />} />
              <Route path="bases" element={<Bases />} />
              <Route path="roles" element={<Roles />} />
              <Route path="apps" element={<Apps />} />
              <Route path="pages" element={<Pages />} />
              <Route path="plans" element={<Plans />} />
              <Route path="schedules" element={<Schedules />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </SidebarProvider>
      </BaseProvider>
    </AuthProvider>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter basename="/admin">
            <AppRoutes />
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
