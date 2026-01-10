import React, { useState, useEffect } from 'react'
import { ServerIcon, CloudIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import axios from 'axios'

interface Environment {
  id: string
  name: string
  url: string
  icon: React.ComponentType<any>
  description: string
}

const environments: Environment[] = [
  {
    id: 'production',
    name: 'Produção',
    url: 'https://ierp.invistto.com',
    icon: CloudIcon,
    description: 'Servidor de produção'
  },
  // Ambiente local apenas em desenvolvimento
  ...(import.meta.env.DEV ? [{
    id: 'local',
    name: 'Local',
    url: 'http://localhost:3001',
    icon: ServerIcon,
    description: 'Servidor local'
  }] : [])
]

export function EnvironmentSelector() {
  // Default: local em DEV, production em PROD
  const [selectedEnv, setSelectedEnv] = useState<string>(
    import.meta.env.DEV ? 'local' : 'production'
  )
  const [isOpen, setIsOpen] = useState(false)
  const [checking, setChecking] = useState<string | null>(null)
  const [statuses, setStatuses] = useState<Record<string, 'online' | 'offline' | 'checking'>>({})

  useEffect(() => {
    // Carregar ambiente salvo
    const saved = localStorage.getItem('@ari:environment')
    if (saved) {
      setSelectedEnv(saved)
      updateApiBaseUrl(saved)
    }
    
    // Verificar status dos ambientes apenas em desenvolvimento
    if (import.meta.env.DEV) {
      checkEnvironments()
    }
  }, [])

  const updateApiBaseUrl = (envId: string) => {
    const env = environments.find(e => e.id === envId)
    if (env) {
      // Atualizar a URL base do axios
      localStorage.setItem('@ari:environment', envId)
      localStorage.setItem('@ari:apiUrl', env.url)
      
      // Recarregar a página para aplicar a nova configuração
      // Nota: Em produção, você pode querer usar um contexto ou store para evitar recarregar
    }
  }

  const checkEnvironments = async () => {
    for (const env of environments) {
      setStatuses(prev => ({ ...prev, [env.id]: 'checking' }))
      
      try {
        // Tentar fazer uma requisição de health check
        const response = await axios.get(`${env.url}/api/health`, {
          timeout: 5000,
          validateStatus: () => true // Aceitar qualquer status
        })
        
        setStatuses(prev => ({ 
          ...prev, 
          [env.id]: response.status < 500 ? 'online' : 'offline' 
        }))
      } catch (error) {
        setStatuses(prev => ({ ...prev, [env.id]: 'offline' }))
      }
    }
  }

  const selectEnvironment = async (envId: string) => {
    const env = environments.find(e => e.id === envId)
    if (!env) return

    setChecking(envId)
    
    try {
      // Em produção, não verificar health check
      if (import.meta.env.DEV) {
        // Verificar se o ambiente está disponível apenas em dev
        await axios.get(`${env.url}/api/health`, { timeout: 5000 })
      }
      
      setSelectedEnv(envId)
      updateApiBaseUrl(envId)
      
      toast.success(`Conectado ao ambiente ${env.name}`)
      setIsOpen(false)
      
      // Recarregar a página após 500ms
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      toast.error(`Não foi possível conectar ao ambiente ${env.name}`)
      setStatuses(prev => ({ ...prev, [envId]: 'offline' }))
    } finally {
      setChecking(null)
    }
  }

  const currentEnv = environments.find(e => e.id === selectedEnv)

  return (
    <div className="relative">
      {/* Botão do seletor */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        {currentEnv && (
          <>
            <currentEnv.icon className="w-4 h-4" />
            <span>{currentEnv.name}</span>
            <div className={`w-2 h-2 rounded-full ${
              statuses[currentEnv.id] === 'online' ? 'bg-green-500' : 
              statuses[currentEnv.id] === 'offline' ? 'bg-red-500' : 
              'bg-yellow-500 animate-pulse'
            }`} />
          </>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">
              AMBIENTE ARI-NEST
            </div>
            
            {environments.map((env) => (
              <button
                key={env.id}
                onClick={() => selectEnvironment(env.id)}
                disabled={checking === env.id}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  selectedEnv === env.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                } ${checking === env.id ? 'opacity-50 cursor-wait' : ''}`}
              >
                <env.icon className="w-5 h-5 flex-shrink-0" />
                
                <div className="flex-1 text-left">
                  <div className="font-medium">{env.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {env.description}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {env.url}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {selectedEnv === env.id && (
                    <CheckCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                  
                  <div className={`w-2 h-2 rounded-full ${
                    statuses[env.id] === 'online' ? 'bg-green-500' : 
                    statuses[env.id] === 'offline' ? 'bg-red-500' : 
                    'bg-yellow-500 animate-pulse'
                  }`} />
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 p-2">
            <button
              onClick={checkEnvironments}
              className="w-full text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 py-1"
            >
              Verificar status dos ambientes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}