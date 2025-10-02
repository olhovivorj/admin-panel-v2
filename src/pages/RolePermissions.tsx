import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { logger } from '../utils/logger'

interface Page {
  id: number
  path: string
  name: string
  category: string | null
  description: string | null
  is_active: boolean
}

interface Permission {
  id?: number
  page_id: number
  can_access: boolean
  can_edit: boolean
  can_delete: boolean
  system_pages?: Page
}

interface Role {
  id: number
  name: string
  display_name: string
  description: string | null
}

export const RolePermissions = () => {
  const { roleId } = useParams<{ roleId: string }>()
  const navigate = useNavigate()
  const [role, setRole] = useState<Role | null>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [permissions, setPermissions] = useState<Map<number, Permission>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [roleId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Carregar role, páginas e permissões em paralelo
      const [rolesRes, pagesRes, permsRes] = await Promise.all([
        api.get('/roles'),
        api.get('/roles/pages'),
        api.get(`/roles/${roleId}/permissions`),
      ])

      const currentRole = rolesRes.data.data.find((r: Role) => r.id === Number(roleId))
      setRole(currentRole)
      setPages(pagesRes.data.data)

      // Criar mapa de permissões
      const permsMap = new Map<number, Permission>()
      permsRes.data.data.forEach((p: Permission) => {
        permsMap.set(p.page_id, p)
      })
      setPermissions(permsMap)
    } catch (error) {
      logger.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = (pageId: number, field: 'can_access' | 'can_edit' | 'can_delete') => {
    setPermissions((prev) => {
      const newMap = new Map(prev)
      const current = newMap.get(pageId) || {
        page_id: pageId,
        can_access: false,
        can_edit: false,
        can_delete: false,
      }

      newMap.set(pageId, {
        ...current,
        [field]: !current[field],
      })

      return newMap
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const permissionsArray = Array.from(permissions.values()).filter(
        (p) => p.can_access || p.can_edit || p.can_delete
      )

      await api.put(`/roles/${roleId}/permissions`, {
        permissions: permissionsArray,
      })

      alert('Permissões salvas com sucesso!')
    } catch (error) {
      logger.error('Erro ao salvar permissões:', error)
      alert('Erro ao salvar permissões')
    } finally {
      setSaving(false)
    }
  }

  // Agrupar páginas por categoria
  const pagesByCategory = pages.reduce((acc, page) => {
    const category = page.category || 'Sem categoria'
    if (!acc[category]) acc[category] = []
    acc[category].push(page)
    return acc
  }, {} as Record<string, Page[]>)

  if (loading) {
    return <div className="p-4">Carregando...</div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/roles')}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4 transition-colors inline-flex items-center gap-2"
        >
          <span>←</span>
          <span>Voltar para Roles</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Permissões: {role?.display_name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{role?.description}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900 dark:text-white">Páginas do Sistema</h2>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar Permissões'}
          </button>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Object.entries(pagesByCategory).map(([category, categoryPages]) => (
            <div key={category} className="p-4">
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">{category}</h3>
              <div className="space-y-2">
                {categoryPages.map((page) => {
                  const perm = permissions.get(page.id) || {
                    page_id: page.id,
                    can_access: false,
                    can_edit: false,
                    can_delete: false,
                  }

                  return (
                    <div
                      key={page.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/30 rounded hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-colors border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{page.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{page.path}</div>
                        {page.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{page.description}</div>
                        )}
                      </div>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={perm.can_access}
                            onChange={() => togglePermission(page.id, 'can_access')}
                            className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 cursor-pointer"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Acessar</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={perm.can_edit}
                            onChange={() => togglePermission(page.id, 'can_edit')}
                            className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 cursor-pointer"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Editar</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={perm.can_delete}
                            onChange={() => togglePermission(page.id, 'can_delete')}
                            className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 cursor-pointer"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Excluir</span>
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
