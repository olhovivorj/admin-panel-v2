import { useState, useEffect } from 'react'
import { XMarkIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { plansService, Plan } from '@/services/plans'
import { pagesService, Page } from '@/services/pages'
import toast from 'react-hot-toast'

interface PlanPagesModalProps {
  isOpen: boolean
  onClose: () => void
  plan: Plan
  onSaved?: () => void
}

interface PagesByApp {
  app: {
    id: number
    name: string
    displayName: string
  } | null
  pages: Page[]
}

export function PlanPagesModal({ isOpen, onClose, plan, onSaved }: PlanPagesModalProps) {
  const [allPages, setAllPages] = useState<Page[]>([])
  const [selectedPageIds, setSelectedPageIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isOpen && plan) {
      loadData()
    }
  }, [isOpen, plan])

  const loadData = async () => {
    try {
      setLoading(true)

      const [pages, planPages] = await Promise.all([
        pagesService.getPages({ includeInactive: false }),
        plansService.getPages(plan.id),
      ])

      setAllPages(pages)

      const selectedIds = new Set<number>(planPages.map((p: any) => p.id))
      setSelectedPageIds(selectedIds)

      // Expandir todos os apps por padrão
      const appNames = new Set<string>()
      pages.forEach(p => appNames.add(p.app?.name || 'sem-app'))
      setExpandedApps(appNames)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar páginas')
    } finally {
      setLoading(false)
    }
  }

  const togglePage = (pageId: number) => {
    setSelectedPageIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(pageId)) {
        newSet.delete(pageId)
      } else {
        newSet.add(pageId)
      }
      return newSet
    })
  }

  const toggleApp = (appName: string) => {
    setExpandedApps((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(appName)) {
        newSet.delete(appName)
      } else {
        newSet.add(appName)
      }
      return newSet
    })
  }

  const selectAllFromApp = (pages: Page[]) => {
    setSelectedPageIds((prev) => {
      const newSet = new Set(prev)
      pages.forEach(p => newSet.add(p.id))
      return newSet
    })
  }

  const deselectAllFromApp = (pages: Page[]) => {
    setSelectedPageIds((prev) => {
      const newSet = new Set(prev)
      pages.forEach(p => newSet.delete(p.id))
      return newSet
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await plansService.setPages(plan.id, Array.from(selectedPageIds))
      toast.success('Páginas do plano atualizadas')
      onSaved?.()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar páginas')
    } finally {
      setSaving(false)
    }
  }

  // Agrupar páginas por app
  const pagesByApp: PagesByApp[] = Object.values(
    allPages.reduce((acc, page) => {
      const appKey = page.app?.name || 'sem-app'
      if (!acc[appKey]) {
        acc[appKey] = {
          app: page.app || null,
          pages: [],
        }
      }
      acc[appKey].pages.push(page)
      return acc
    }, {} as Record<string, PagesByApp>)
  ).sort((a, b) => {
    // Ordenar: admin-panel primeiro, depois alfabético
    if (a.app?.name === 'admin-panel') return -1
    if (b.app?.name === 'admin-panel') return 1
    return (a.app?.displayName || 'Sem App').localeCompare(b.app?.displayName || 'Sem App')
  })

  // Contar selecionadas por app
  const getAppStats = (pages: Page[]) => {
    const selected = pages.filter(p => selectedPageIds.has(p.id)).length
    return { selected, total: pages.length }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
          {/* Header */}
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Páginas do Plano: {plan.displayName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedPageIds.size} de {allPages.length} páginas selecionadas
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[65vh] overflow-y-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Carregando páginas...</p>
              </div>
            ) : allPages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">Nenhuma página cadastrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pagesByApp.map(({ app, pages }) => {
                  const appKey = app?.name || 'sem-app'
                  const isExpanded = expandedApps.has(appKey)
                  const stats = getAppStats(pages)
                  const allSelected = stats.selected === stats.total
                  const noneSelected = stats.selected === 0

                  return (
                    <div
                      key={appKey}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      {/* App Header */}
                      <div
                        className="bg-gray-50 dark:bg-gray-900 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => toggleApp(appKey)}
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                          )}
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {app?.displayName || 'Sem App'}
                            </span>
                            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                              ({stats.selected}/{stats.total})
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => selectAllFromApp(pages)}
                            disabled={allSelected}
                            className="px-2 py-1 text-xs border border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Todas
                          </button>
                          <button
                            onClick={() => deselectAllFromApp(pages)}
                            disabled={noneSelected}
                            className="px-2 py-1 text-xs border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Nenhuma
                          </button>
                        </div>
                      </div>

                      {/* Pages Table */}
                      {isExpanded && (
                        <table className="w-full">
                          <thead className="bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 uppercase">
                            <tr>
                              <th className="w-12 px-4 py-2 text-center"></th>
                              <th className="px-4 py-2 text-left">Página</th>
                              <th className="px-4 py-2 text-left">Path</th>
                              <th className="px-4 py-2 text-left">Categoria</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {pages
                              .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                              .map((page) => {
                                const isSelected = selectedPageIds.has(page.id)
                                return (
                                  <tr
                                    key={page.id}
                                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                    }`}
                                    onClick={() => togglePage(page.id)}
                                  >
                                    <td className="px-4 py-2 text-center">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => togglePage(page.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {page.displayName || page.name}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2">
                                      <code className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                        {page.path}
                                      </code>
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                      {page.category || '-'}
                                    </td>
                                  </tr>
                                )
                              })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Salvando...' : 'Salvar Páginas'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
