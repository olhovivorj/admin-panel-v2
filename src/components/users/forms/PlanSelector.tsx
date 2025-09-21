import { useState, useEffect } from 'react'
import { CreditCardIcon, SparklesIcon, RocketLaunchIcon, ShieldCheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import api from '@/services/api'

interface AccessPlan {
  id: number
  name: string
  display_name: string
  level: number
  price: number
  is_admin: boolean
}

interface PlanSelectorProps {
  value?: number
  onChange: (planId: number) => void
  disabled?: boolean
  required?: boolean
}

// Ícones para cada plano
const planIcons = {
  basic: CreditCardIcon,
  standard: SparklesIcon,
  premium: RocketLaunchIcon,
  admin: ShieldCheckIcon
}

// Cores para cada plano
const planColors = {
  basic: 'gray',
  standard: 'blue',
  premium: 'purple',
  admin: 'red'
}

export function PlanSelector({ value, onChange, disabled = false, required = false }: PlanSelectorProps) {
  const [plans, setPlans] = useState<AccessPlan[]>([])
  const [filteredPlans, setFilteredPlans] = useState<AccessPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Carregar planos disponíveis
  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const response = await api.get('/access-plans')
      const plansData = response.data || []
      setPlans(plansData)
      setFilteredPlans(plansData)
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      // Planos padrão caso falhe
      const defaultPlans = [
        { id: 1, name: 'basic', display_name: 'Básico', level: 1, price: 0, is_admin: false },
        { id: 2, name: 'standard', display_name: 'Standard', level: 2, price: 49.90, is_admin: false },
        { id: 3, name: 'premium', display_name: 'Premium', level: 3, price: 99.90, is_admin: false },
        { id: 4, name: 'admin', display_name: 'Administrador', level: 4, price: 0, is_admin: true }
      ]
      setPlans(defaultPlans)
      setFilteredPlans(defaultPlans)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar planos baseado na pesquisa
  useEffect(() => {
    if (!searchTerm) {
      setFilteredPlans(plans)
    } else {
      const filtered = plans.filter(plan =>
        plan.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredPlans(filtered)
    }
  }, [searchTerm, plans])

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Plano de Acesso {required && <span className="text-red-500">*</span>}
      </label>

      {/* Campo de pesquisa */}
      <div className="relative mb-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar plano..."
          disabled={disabled}
          className="w-full px-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>

      {loading ? (
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded-lg"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredPlans.map((plan) => {
            const Icon = planIcons[plan.name as keyof typeof planIcons] || CreditCardIcon
            const color = planColors[plan.name as keyof typeof planColors] || 'gray'
            const isSelected = value === plan.id

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => onChange(plan.id)}
                disabled={disabled}
                className={`
                  relative p-4 rounded-lg border-2 transition-all
                  ${isSelected
                    ? `border-${color}-500 bg-${color}-50`
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-6 w-6 ${isSelected ? `text-${color}-600` : 'text-gray-400'}`} />
                  <div className="text-left">
                    <p className={`font-medium ${isSelected ? `text-${color}-900` : 'text-gray-900'}`}>
                      {plan.display_name}
                    </p>
                    {plan.price > 0 && (
                      <p className="text-xs text-gray-500">
                        R$ {plan.price.toFixed(2)}/mês
                      </p>
                    )}
                  </div>
                </div>

                {/* Badge de selecionado */}
                {isSelected && (
                  <div className={`absolute top-2 right-2 w-3 h-3 bg-${color}-500 rounded-full`}></div>
                )}

                {/* Badge de admin */}
                {plan.is_admin && (
                  <span className="absolute top-2 right-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    Admin
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Mensagem quando não há resultados */}
      {!loading && filteredPlans.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p>Nenhum plano encontrado para "{searchTerm}"</p>
        </div>
      )}

      {/* Mensagem de ajuda */}
      <p className="text-xs text-gray-500">
        O plano determina quais funcionalidades o usuário pode acessar
      </p>
    </div>
  )
}