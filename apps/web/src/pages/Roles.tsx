import React, { useState, useEffect } from 'react'
import {
  ShieldCheckIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { Role, rolesService } from '@/services/roles'
import { RoleFormModal } from '@/components/roles/RoleFormModal'
import toast from 'react-hot-toast'

export function Roles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await rolesService.getRoles()
      setRoles(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar roles')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedRole(null)
    setShowFormModal(true)
  }

  const handleEdit = (role: Role, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedRole(role)
    setShowFormModal(true)
  }

  const handleSave = async (data: any) => {
    try {
      if (selectedRole) {
        await rolesService.updateRole(selectedRole.id, data)
        toast.success('Role atualizada com sucesso')
      } else {
        await rolesService.createRole(data)
        toast.success('Role criada com sucesso')
      }
      await loadRoles()
    } catch (err: any) {
      throw err
    }
  }

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await rolesService.deleteRole(id)
      toast.success('Role removida com sucesso')
      setDeleteConfirm(null)
      await loadRoles()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao remover role')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <ShieldCheckIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <button
            onClick={loadRoles}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Roles
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gerencie os níveis de acesso do sistema (priority define direitos)
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nova Role
        </button>
      </div>

      <div className="grid gap-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 hover:shadow-md dark:hover:shadow-gray-900/70 transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ShieldCheckIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {role.displayName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {role.description || 'Sem descrição'}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Código: <span className="font-mono text-gray-700 dark:text-gray-300">{role.name}</span>
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Prioridade: <span className="font-semibold text-gray-700 dark:text-gray-300">{role.priority}</span>
                    </span>
                    {role.usersCount !== undefined && (
                      <span className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <UsersIcon className="h-3 w-3 mr-1" />
                        {role.usersCount} usuários
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => handleEdit(role, e)}
                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="Editar role"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                {deleteConfirm === role.id ? (
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleDelete(role.id, e)}
                      className="px-2 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirm(null)
                      }}
                      className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirm(role.id)
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Excluir role"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {roles.length === 0 && !loading && (
        <div className="text-center py-12">
          <ShieldCheckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Nenhuma role encontrada
          </p>
          <button
            onClick={handleCreate}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Criar primeira role
          </button>
        </div>
      )}

      {/* Modal */}
      <RoleFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false)
          setSelectedRole(null)
        }}
        onSave={handleSave}
        role={selectedRole}
      />
    </div>
  )
}
