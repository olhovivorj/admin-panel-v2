import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { api } from '@/services/api'
import toast from 'react-hot-toast'

interface BaseConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
  baseId: number
  baseName: string
}

interface ZeissConfig {
  precoPorCnpj: 'S' | 'N'
  ativo: boolean
}

export function BaseConfigModal({ isOpen, onClose, onSave, baseId, baseName }: BaseConfigModalProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<ZeissConfig>({
    precoPorCnpj: 'S',
    ativo: true,
  })

  useEffect(() => {
    if (isOpen && baseId) {
      loadConfig()
    }
  }, [isOpen, baseId])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/bases/${baseId}/zeiss-config`)
      setConfig(response.data)
    } catch (error) {
      console.error('Erro ao carregar config:', error)
      toast.error('Erro ao carregar configuracoes')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await api.put(`/bases/${baseId}/zeiss-config`, config)
      toast.success('Configuracoes salvas')
      onSave?.()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar configuracoes')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Config Base
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{baseName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : (
              <>
                {/* Integração Zeiss Ativa */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Integracao Zeiss
                  </label>
                  <label className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Integracao Zeiss Ativa</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Habilita sincronizacao de lentes e precos Zeiss
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, ativo: !config.ativo })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.ativo ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.ativo ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                </div>

                {/* Preco por CNPJ */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Modo de Precos Zeiss
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="precoPorCnpj"
                        checked={config.precoPorCnpj === 'S'}
                        onChange={() => setConfig({ ...config, precoPorCnpj: 'S' })}
                        className="h-4 w-4 text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Preco por Loja (CNPJ)</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Cada loja pode ter precos diferentes
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="precoPorCnpj"
                        checked={config.precoPorCnpj === 'N'}
                        onChange={() => setConfig({ ...config, precoPorCnpj: 'N' })}
                        className="h-4 w-4 text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Preco Unico (Rede)</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Todas as lojas usam a mesma tabela
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading || saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
