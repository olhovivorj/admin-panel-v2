import React, { useState, useEffect } from 'react'
import {
  CreditCardIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  UsersIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import { Plan, plansService } from '@/services/plans'
import { PlanFormModal } from '@/components/plans/PlanFormModal'
import { PlanPagesModal } from '@/components/plans/PlanPagesModal'
import toast from 'react-hot-toast'

export function Plans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false)
  const [showPagesModal, setShowPagesModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  useEffect(() => {
    loadPlans()
  }, [showInactive])

  const loadPlans = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await plansService.getPlans(showInactive)
      setPlans(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedPlan(null)
    setShowFormModal(true)
  }

  const handleEdit = async (plan: Plan) => {
    try {
      const fullPlan = await plansService.getPlan(plan.id)
      setSelectedPlan(fullPlan)
      setShowFormModal(true)
    } catch (err) {
      toast.error('Erro ao carregar dados do plano')
    }
  }

  const handleSave = async (data: any) => {
    try {
      if (selectedPlan) {
        await plansService.updatePlan(selectedPlan.id, data)
        toast.success('Plano atualizado com sucesso')
      } else {
        await plansService.createPlan(data)
        toast.success('Plano criado com sucesso')
      }
      await loadPlans()
    } catch (err: any) {
      throw err
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await plansService.deletePlan(id)
      toast.success('Plano removido com sucesso')
      setDeleteConfirm(null)
      await loadPlans()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao remover plano')
    }
  }

  const handleToggleStatus = async (id: number) => {
    try {
      const result = await plansService.toggleStatus(id)
      toast.success(result.message)
      await loadPlans()
    } catch (err) {
      toast.error('Erro ao alterar status')
    }
  }

  const handleConfigurePages = (plan: Plan) => {
    setSelectedPlan(plan)
    setShowPagesModal(true)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planos</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando planos...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planos</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center py-12">
            <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Erro ao carregar planos
            </h3>
            <p className="mt-1 text-sm text-red-600">{error}</p>
            <button
              onClick={loadPlans}
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planos</h1>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Novo Plano
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
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

      {/* Plans grid */}
      {plans.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="text-center py-12">
            <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Nenhum plano encontrado
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comece criando um novo plano
            </p>
            <button
              onClick={handleCreate}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Criar primeiro plano
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border-2 ${
                plan.isActive
                  ? 'border-transparent hover:border-blue-500'
                  : 'border-gray-200 dark:border-gray-700 opacity-75'
              } transition-all`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {plan.displayName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{plan.name}</p>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(plan.id)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                      plan.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 hover:bg-red-200'
                    }`}
                  >
                    {plan.isActive ? (
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
                </div>

                <div className="mt-4">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(plan.price)}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/mês</span>
                  </p>
                </div>

                {plan.description && (
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                    {plan.description}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    {plan.pagesCount} páginas
                  </span>
                  <span className="inline-flex items-center">
                    <UsersIcon className="h-4 w-4 mr-1" />
                    {plan.usersCount} usuários
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex justify-end space-x-2">
                <button
                  onClick={() => handleConfigurePages(plan)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-1" />
                  Páginas
                </button>
                <button
                  onClick={() => handleEdit(plan)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Editar
                </button>
                {deleteConfirm === plan.id ? (
                  <>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(plan.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Excluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <PlanFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false)
          setSelectedPlan(null)
        }}
        onSave={handleSave}
        plan={selectedPlan}
      />

      {selectedPlan && (
        <PlanPagesModal
          isOpen={showPagesModal}
          onClose={() => {
            setShowPagesModal(false)
            setSelectedPlan(null)
          }}
          plan={selectedPlan}
          onSaved={loadPlans}
        />
      )}
    </div>
  )
}
