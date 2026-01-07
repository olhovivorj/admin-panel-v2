import React, { useState, useEffect, useMemo } from 'react'
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import { Page, pagesService } from '@/services/pages'
import { App, appsService } from '@/services/apps'
import { PageFormModal } from '@/components/pages/PageFormModal'
import toast from 'react-hot-toast'

export function Pages() {
  const [pages, setPages] = useState<Page[]>([])
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [filterAppId, setFilterAppId] = useState<number | null>(null)

  // Modals
  const [showFormModal, setShowFormModal] = useState(false)
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [showInactive, filterAppId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [pagesData, appsData] = await Promise.all([
        pagesService.getPages({ appId: filterAppId || undefined, includeInactive: showInactive }),
        appsService.getApps(true),
      ])
      setPages(pagesData)
      setApps(appsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar páginas')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedPage(null)
    setShowFormModal(true)
  }

  const handleEdit = async (page: Page) => {
    try {
      const fullPage = await pagesService.getPage(page.id)
      setSelectedPage(fullPage)
      setShowFormModal(true)
    } catch (err) {
      toast.error('Erro ao carregar dados da página')
    }
  }

  const handleSave = async (data: any) => {
    try {
      if (selectedPage) {
        await pagesService.updatePage(selectedPage.id, data)
        toast.success('Página atualizada com sucesso')
      } else {
        await pagesService.createPage(data)
        toast.success('Página criada com sucesso')
      }
      await loadData()
    } catch (err: any) {
      throw err
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await pagesService.deletePage(id)
      toast.success('Página removida com sucesso')
      setDeleteConfirm(null)
      await loadData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao remover página')
    }
  }

  const handleToggleStatus = async (id: number) => {
    try {
      const result = await pagesService.toggleStatus(id)
      toast.success(result.message)
      await loadData()
    } catch (err) {
      toast.error('Erro ao alterar status')
    }
  }

  // Filter pages
  const filteredPages = useMemo(() => {
    if (!searchTerm.trim()) return pages

    const search = searchTerm.toLowerCase()
    return pages.filter(
      (page) =>
        page.name.toLowerCase().includes(search) ||
        page.displayName.toLowerCase().includes(search) ||
        page.path.toLowerCase().includes(search) ||
        page.category?.toLowerCase().includes(search)
    )
  }, [pages, searchTerm])

  // Group by app
  const groupedPages = useMemo(() => {
    const groups: Record<string, { app: App | null; pages: Page[] }> = {}

    filteredPages.forEach(page => {
      const appKey = page.app?.displayName || 'Sem App'
      if (!groups[appKey]) {
        groups[appKey] = {
          app: page.app ? apps.find(a => a.id === page.appId) || null : null,
          pages: [],
        }
      }
      groups[appKey].pages.push(page)
    })

    return groups
  }, [filteredPages, apps])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Páginas</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando páginas...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Páginas</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center py-12">
            <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Erro ao carregar páginas
            </h3>
            <p className="mt-1 text-sm text-red-600">{error}</p>
            <button
              onClick={loadData}
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Páginas</h1>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nova Página
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
              placeholder="Buscar páginas..."
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

          {/* Filter by App */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={filterAppId || ''}
              onChange={(e) => setFilterAppId(e.target.value ? parseInt(e.target.value) : null)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Todos os Apps</option>
              {apps.map(app => (
                <option key={app.id} value={app.id}>
                  {app.displayName}
                </option>
              ))}
            </select>
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

      {/* Pages list grouped by app */}
      {Object.keys(groupedPages).length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Nenhuma página encontrada
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Tente uma busca diferente' : 'Comece criando uma nova página'}
            </p>
          </div>
        </div>
      ) : (
        Object.entries(groupedPages).map(([appName, { pages: groupPages }]) => (
          <div key={appName} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                {appName}
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  ({groupPages.length} {groupPages.length === 1 ? 'página' : 'páginas'})
                </span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Página
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Path
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Categoria
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
                  {groupPages.map((page) => (
                    <tr key={page.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {page.displayName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {page.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {page.path}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {page.category || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(page.id)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                            page.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 hover:bg-red-200'
                          }`}
                        >
                          {page.isActive ? (
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
                          onClick={() => handleEdit(page)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Editar
                        </button>
                        {deleteConfirm === page.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(page.id)}
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
                            onClick={() => setDeleteConfirm(page.id)}
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
          </div>
        ))
      )}

      {/* Modal */}
      <PageFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false)
          setSelectedPage(null)
        }}
        onSave={handleSave}
        page={selectedPage}
      />
    </div>
  )
}
