import React, { useState, useEffect } from 'react'
import { XMarkIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { FirebirdConfig } from '@/services/bases'

interface FirebirdConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: FirebirdConfig) => Promise<void>
  baseId: number
  baseName: string
  initialConfig?: any
}

export function FirebirdConfigModal({
  isOpen,
  onClose,
  onSave,
  baseId,
  baseName,
  initialConfig,
}: FirebirdConfigModalProps) {
  const [config, setConfig] = useState<FirebirdConfig>({
    host: 'localhost',
    port: 3050,
    database: '',
    user: 'SYSDBA',
    password: '',
    role: 'RDB$ADMIN',
    charset: 'UTF8',
    active: true,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialConfig) {
      setConfig({
        host: initialConfig.host || 'localhost',
        port: initialConfig.port || 3050,
        database: initialConfig.database || '',
        user: initialConfig.user || 'SYSDBA',
        password: '', // Sempre vazio por segurança
        role: initialConfig.role || 'RDB$ADMIN',
        charset: initialConfig.charset || 'UTF8',
        active: initialConfig.active !== false,
      })
    }
  }, [initialConfig])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!config.host?.trim()) {
      newErrors.host = 'Host é obrigatório'
    }

    if (!config.port || config.port < 1 || config.port > 65535) {
      newErrors.port = 'Porta deve estar entre 1 e 65535'
    }

    if (!config.database?.trim()) {
      newErrors.database = 'Caminho do banco é obrigatório'
    }

    if (!config.user?.trim()) {
      newErrors.user = 'Usuário é obrigatório'
    }

    // Senha só é obrigatória se não há configuração anterior
    if (!initialConfig?.passwordConfigured && !config.password?.trim()) {
      newErrors.password = 'Senha é obrigatória'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    console.log('🔧 handleSave chamado')
    console.log('🔧 initialConfig.passwordConfigured:', initialConfig?.passwordConfigured)
    console.log('🔧 config:', config)

    if (!validateForm()) {
      console.log('❌ Validação falhou')
      return
    }

    console.log('✅ Validação passou')
    setIsLoading(true)
    try {
      // Remove campos vazios/undefined
      const configToSave = Object.fromEntries(
        Object.entries(config).filter(([_, value]) => value !== '' && value !== undefined),
      ) as FirebirdConfig

      console.log('📤 Enviando:', configToSave)
      await onSave(configToSave)
      onClose()
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error)
      // Exibir detalhes do erro
      const errorMsg = error?.response?.data?.message || error?.message || 'Erro desconhecido'
      console.error('📛 Mensagem do erro:', errorMsg)
      toast.error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof FirebirdConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }))

    // Limpar erro do campo ao digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Configurar Firebird - {baseName}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Host */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Host *
                </label>
                <input
                  type="text"
                  value={config.host || ''}
                  onChange={(e) => handleInputChange('host', e.target.value)}
                  className={`mt-1 block w-full rounded-md border ${
                    errors.host ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  } px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  placeholder="localhost ou IP do servidor"
                />
                {errors.host && (
                  <p className="mt-1 text-sm text-red-600">{errors.host}</p>
                )}
              </div>

              {/* Port */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Porta *
                </label>
                <input
                  type="number"
                  value={config.port || ''}
                  onChange={(e) => handleInputChange('port', parseInt(e.target.value))}
                  className={`mt-1 block w-full rounded-md border ${
                    errors.port ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  } px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  placeholder="3050"
                />
                {errors.port && (
                  <p className="mt-1 text-sm text-red-600">{errors.port}</p>
                )}
              </div>

              {/* Database */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Caminho do Banco *
                </label>
                <input
                  type="text"
                  value={config.database || ''}
                  onChange={(e) => handleInputChange('database', e.target.value)}
                  className={`mt-1 block w-full rounded-md border ${
                    errors.database ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  } px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  placeholder="/opt/firebird/dados/base.fdb"
                />
                {errors.database && (
                  <p className="mt-1 text-sm text-red-600">{errors.database}</p>
                )}
              </div>

              {/* User */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Usuário *
                </label>
                <input
                  type="text"
                  value={config.user || ''}
                  onChange={(e) => handleInputChange('user', e.target.value)}
                  className={`mt-1 block w-full rounded-md border ${
                    errors.user ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  } px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  placeholder="SYSDBA"
                />
                {errors.user && (
                  <p className="mt-1 text-sm text-red-600">{errors.user}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Senha {!initialConfig?.passwordConfigured && '*'}
                  {initialConfig?.passwordConfigured && (
                    <span className="text-sm text-gray-500"> (deixe vazio para manter atual)</span>
                  )}
                </label>
                <input
                  type="password"
                  value={config.password || ''}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`mt-1 block w-full rounded-md border ${
                    errors.password ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  } px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  placeholder={initialConfig?.passwordConfigured ? '••••••••' : 'Senha do Firebird'}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role
                </label>
                <select
                  value={config.role || 'RDB$ADMIN'}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="RDB$ADMIN">RDB$ADMIN</option>
                  <option value="OWNER">OWNER</option>
                  <option value="">Nenhuma</option>
                </select>
              </div>

              {/* Charset */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Charset
                </label>
                <select
                  value={config.charset || 'UTF8'}
                  onChange={(e) => handleInputChange('charset', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="UTF8">UTF8</option>
                  <option value="WIN1252">WIN1252</option>
                  <option value="ISO8859_1">ISO8859_1</option>
                </select>
              </div>

              {/* Active */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.active !== false}
                  onChange={(e) => handleInputChange('active', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Firebird ativo para esta base
                </label>
              </div>
            </div>

            {/* Warning */}
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    A configuração Firebird determina se esta base estará ativa no sistema.
                    Bases sem configuração ficam inativas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </div>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Salvar Configuração
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}