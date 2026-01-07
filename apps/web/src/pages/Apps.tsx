import React, { useState, useEffect, useMemo } from 'react'
import {
  CubeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { App, AppWithPages, appsService } from '@/services/apps'
import { AppFormModal } from '@/components/apps/AppFormModal'
import { AppPagesModal } from '@/components/apps/AppPagesModal'
import toast from 'react-hot-toast'

export function Apps() {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  // Modals
  const [showFormModal, setShowFormModal] = useState(false)
  const [showPagesModal, setShowPagesModal] = useState(false)
  const [selectedApp, setSelectedApp] = useState<AppWithPages | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  useEffect(() => {
    loadApps()
  }, [showInactive])

  const loadApps = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await appsService.getApps(showInactive)
      setApps(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar apps')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedApp(null)
    setShowFormModal(true)
  }

  const handleEdit = async (app: App) => {
    try {
      const fullApp = await appsService.getApp(app.id)
      setSelectedApp(fullApp)
      setShowFormModal(true)
    } catch (err) {
      toast.error('Erro ao carregar dados do app')
    }
  }

  const handleViewPages = async (app: App) => {
    try {
      const fullApp = await appsService.getApp(app.id)
      setSelectedApp(fullApp)
      setShowPagesModal(true)
    } catch (err) {
      toast.error('Erro ao carregar páginas')
    }
  }

  const handleSave = async (data: any) => {
    try {
      if (selectedApp) {
        await appsService.updateApp(selectedApp.id, data)
        toast.success('App atualizado com sucesso')
      } else {
        await appsService.createApp(data)
        toast.success('App criado com sucesso')
      }
      await loadApps()
    } catch (err: any) {
      throw err // Let modal handle the error
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await appsService.deleteApp(id)
      toast.success('App removido com sucesso')
      setDeleteConfirm(null)
      await loadApps()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao remover app')
    }
  }

  const handleToggleStatus = async (id: number) => {
    try {
      const result = await appsService.toggleStatus(id)
      toast.success(result.message)
      await loadApps()
    } catch (err) {
      toast.error('Erro ao alterar status')
    }
  }

  // Filter apps
  const filteredApps = useMemo(() => {
    if (!searchTerm.trim()) return apps

    const search = searchTerm.toLowerCase()
    return apps.filter(
      (app) =>
        app.name.toLowerCase().includes(search) ||
        app.displayName.toLowerCase().includes(search) ||
        app.description?.toLowerCase().includes(search)
    )
  }, [apps, searchTerm])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Apps</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando apps...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Apps</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center py-12">
            <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Erro ao carregar apps
            </h3>
            <p className="mt-1 text-sm text-red-600">{error}</p>
            <button
              onClick={loadApps}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Apps</h1>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Novo App
        </button>
      </div>

      {/* Search and filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar apps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showInactive"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showInactive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Mostrar inativos
            </label>
          </div>
        </div>
      </div>

      {/* Apps list */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {filteredApps.length === 0 ? (
          <div className="text-center py-12">
            <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Nenhum app encontrado
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Tente uma busca diferente' : 'Comece criando um novo app'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    App
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Páginas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CubeIcon className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {app.displayName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {app.name}
                          </div>
                          {app.description && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs truncate">
                              {app.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewPages(app)}
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <DocumentTextIcon className="h-4 w-4 mr-1" />
                        {app.activePagesCount} / {app.pagesCount}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(app.id)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                          app.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 hover:bg-red-200'
                        }`}
                      >
                        {app.isActive ? (
                          <>
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            Inativo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(app)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Editar
                      </button>
                      {deleteConfirm === app.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(app.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(app.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Excluir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AppFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false)
          setSelectedApp(null)
        }}
        onSave={handleSave}
        app={selectedApp}
      />

      <AppPagesModal
        isOpen={showPagesModal}
        onClose={() => {
          setShowPagesModal(false)
          setSelectedApp(null)
        }}
        app={selectedApp}
      />
    </div>
  )
}
