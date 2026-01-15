import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@invistto/auth-react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { logger } from '@/utils/logger'

const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  password: z.string().min(3, 'A senha deve ter no mínimo 3 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function Login() {
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)

  // Garantir que os estilos estão carregados antes de mostrar o conteúdo
  React.useEffect(() => {
    // Pequeno delay para garantir que CSS foi aplicado
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 10)
    return () => clearTimeout(timer)
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    logger.info('Login attempt', 'AUTH', { email: data.email })
    try {
      setIsLoading(true)
      await login(data.email, data.password)
    } catch (error) {
      logger.error('Login error in form', 'AUTH', { email: data.email, error })
      // Erro já tratado no contexto
    } finally {
      setIsLoading(false)
    }
  }

  // Função para login rápido em desenvolvimento
  async function handleQuickLogin() {
    setValue('email', 'admin@invistto.com.br')
    setValue('password', 'admin123')

    // Aguardar um momento para os valores serem definidos
    setTimeout(() => {
      handleSubmit(onSubmit)()
    }, 100)
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4"
      style={{
        opacity: isReady ? 1 : 0,
        transition: 'opacity 0.2s ease-in',
        // Estilos inline críticos para prevenir FOUC
        backgroundColor: document.documentElement.classList.contains('dark') ? '#111827' : '#f9fafb',
        minHeight: '100vh'
      }}
    >
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img
            src="/admin/assets/invistto-logo.png"
            alt="INVISTTO"
            className="mx-auto h-12 w-auto"
          />
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Painel Administrativo ARI
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Entre com suas credenciais para acessar o sistema
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="seu@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <LoadingSpinner size="sm" className="text-white" /> : 'Entrar'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Sistema ARI © 2025 INVISTTO - Todos os direitos reservados
          </p>

          {/* Botão de desenvolvimento - remover em produção */}
          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={handleQuickLogin}
              className="mt-4 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
            >
              Login rápido (desenvolvimento)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}