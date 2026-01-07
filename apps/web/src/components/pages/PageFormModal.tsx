import React, { useState, useEffect } from 'react'
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { Page, CreatePageDto, UpdatePageDto } from '@/services/pages'
import { App, appsService } from '@/services/apps'

interface PageFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreatePageDto | UpdatePageDto) => Promise<void>
  page?: Page | null
}

export function PageFormModal({
  isOpen,
  onClose,
  onSave,
  page,
}: PageFormModalProps) {
  const [formData, setFormData] = useState<CreatePageDto>({
    name: '',
    displayName: '',
    path: '',
    category: '',
    appId: undefined,
    icon: '',
    description: '',
    isActive: true,
    order: 0,
  })

  const [apps, setApps] = useState<App[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEdit = !!page

  useEffect(() => {
    if (isOpen) {
      loadApps()
    }
  }, [isOpen])

  useEffect(() => {
    if (page) {
      setFormData({
        name: page.name,
        displayName: page.displayName,
        path: page.path,
        category: page.category || '',
        appId: page.appId,
        icon: page.icon || '',
        description: page.description || '',
        isActive: page.isActive,
        order: page.order,
      })
    } else {
      setFormData({
        name: '',
        displayName: '',
        path: '',
        category: '',
        appId: undefined,
        icon: '',
        description: '',
        isActive: true,
        order: 0,
      })
    }
    setErrors({})
  }, [page, isOpen])

  const loadApps = async () => {
    try {
      const data = await appsService.getApps(true)
      setApps(data)
    } catch (error) {
      console.error('Erro ao carregar apps:', error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Nome (slug) é obrigatório'
    } else if (!/^[a-z0-9-]+$/.test(formData.name)) {
      newErrors.name = 'Nome deve conter apenas letras minúsculas, números e hífens'
    }

    if (!formData.displayName?.trim()) {
      newErrors.displayName = 'Nome de exibição é obrigatório'
    }

    if (!formData.path?.trim()) {
      newErrors.path = 'Path é obrigatório'
    } else if (!formData.path.startsWith('/')) {
      newErrors.path = 'Path deve começar com /'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error: any) {
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message })
      } else {
        setErrors({ general: 'Erro ao salvar página' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreatePageDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Auto-generate slug from displayName
  const handleDisplayNameChange = (value: string) => {
    handleInputChange('displayName', value)
    if (!isEdit && !formData.name) {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      handleInputChange('name', slug)
    }
  }

  // Auto-generate path from name
  const handleNameChange = (value: string) => {
    handleInputChange('name', value.toLowerCase())
    if (!isEdit && !formData.path) {
      handleInputChange('path', `/${value.toLowerCase()}`)
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
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {isEdit ? 'Editar Página' : 'Nova Página'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome de Exibição *
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleDisplayNameChange(e.target.value)}
                  className={`mt-1 block w-full rounded-md border ${
                    errors.displayName ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  } px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  placeholder="Ex: Gerenciamento de Usuários"
                />
                {errors.displayName && (
                  <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>
                )}
              </div>

              {/* Name (slug) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome (slug) *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`mt-1 block w-full rounded-md border ${
                    errors.name ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  } px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  placeholder="Ex: user-management"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Path */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Path *
                </label>
                <input
                  type="text"
                  value={formData.path}
                  onChange={(e) => handleInputChange('path', e.target.value)}
                  className={`mt-1 block w-full rounded-md border ${
                    errors.path ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  } px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  placeholder="Ex: /users"
                />
                {errors.path && (
                  <p className="mt-1 text-sm text-red-600">{errors.path}</p>
                )}
              </div>

              {/* App */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  App
                </label>
                <select
                  value={formData.appId || ''}
                  onChange={(e) => handleInputChange('appId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Sem app</option>
                  {apps.map(app => (
                    <option key={app.id} value={app.id}>
                      {app.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Categoria
                </label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: Administração"
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ícone
                </label>
                <input
                  type="text"
                  value={formData.icon || ''}
                  onChange={(e) => handleInputChange('icon', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: FiUsers"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descrição
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Descrição da página..."
                />
              </div>

              {/* Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ordem
                </label>
                <input
                  type="number"
                  value={formData.order || 0}
                  onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Active */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive !== false}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Página ativa
                </label>
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
                  {isEdit ? 'Salvar Alterações' : 'Criar Página'}
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
