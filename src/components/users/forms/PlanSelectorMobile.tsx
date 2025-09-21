import { useState, useEffect } from 'react'
import {
  CreditCardIcon,
  SparklesIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import api from '@/services/api'

interface AccessPlan {
  id: number
  name: string
  display_name: string
  level: number
  price: number
  is_admin: boolean
  features?: string[]
}

interface PlanSelectorMobileProps {
  value?: number
  onChange: (planId: number) => void
  disabled?: boolean
  required?: boolean
}

// Configuração visual dos planos
const planConfig = {
  basic: {
    icon: CreditCardIcon,
    color: 'gray',
    gradient: 'from-gray-50 to-gray-100',
    border: 'border-gray-200',
    features: ['Dashboard básico', 'Relatórios simples', '1 usuário']
  },
  standard: {
    icon: SparklesIcon,
    color: 'blue',
    gradient: 'from-blue-50 to-indigo-100',
    border: 'border-blue-200',
    features: ['Dashboard completo', 'Relatórios avançados', '5 usuários', 'Suporte email']
  },
  premium: {
    icon: RocketLaunchIcon,
    color: 'purple',
    gradient: 'from-purple-50 to-pink-100',
    border: 'border-purple-200',
    features: ['Tudo do Standard', 'API access', 'Usuários ilimitados', 'Suporte prioritário']
  },
  admin: {
    icon: ShieldCheckIcon,
    color: 'red',
    gradient: 'from-red-50 to-orange-100',
    border: 'border-red-200',
    features: ['Acesso total', 'Gerenciar bases', 'Configurações avançadas', 'Suporte VIP']
  }
}

export function PlanSelectorMobile({
  value,
  onChange,
  disabled = false,
  required = false
}: PlanSelectorMobileProps) {
  const [plans, setPlans] = useState<AccessPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState<number | null>(null)

  // Carregar planos
  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const response = await api.get('/access-plans')
      const plansData = response.data || []
      // Adicionar features aos planos
      const plansWithFeatures = plansData.map((plan: AccessPlan) => ({
        ...plan,
        features: planConfig[plan.name as keyof typeof planConfig]?.features || []
      }))
      setPlans(plansWithFeatures)
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      // Planos padrão
      setPlans([
        {
          id: 1,
          name: 'basic',
          display_name: 'Básico',
          level: 1,
          price: 0,
          is_admin: false,
          features: planConfig.basic.features
        },
        {
          id: 2,
          name: 'standard',
          display_name: 'Standard',
          level: 2,
          price: 49.90,
          is_admin: false,
          features: planConfig.standard.features
        },
        {
          id: 3,
          name: 'premium',
          display_name: 'Premium',
          level: 3,
          price: 99.90,
          is_admin: false,
          features: planConfig.premium.features
        },
        {
          id: 4,
          name: 'admin',
          display_name: 'Administrador',
          level: 4,
          price: 0,
          is_admin: true,
          features: planConfig.admin.features
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (planId: number) => {
    onChange(planId)
    setShowDetails(null) // Fecha detalhes ao selecionar
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Plano de Acesso {required && <span className="text-red-500">*</span>}
      </label>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const config = planConfig[plan.name as keyof typeof planConfig]
            const Icon = config?.icon || CreditCardIcon
            const isSelected = value === plan.id
            const isExpanded = showDetails === plan.id

            return (
              <div key={plan.id} className="relative">
                {/* Card do plano - Mobile optimized */}
                <button
                  type="button"
                  onClick={() => handleSelect(plan.id)}
                  disabled={disabled}
                  className={`
                    w-full p-4 rounded-2xl border-2 transition-all relative
                    ${isSelected
                      ? `bg-gradient-to-r ${config?.gradient} ${config?.border} shadow-md`
                      : 'bg-white border-gray-200 hover:border-gray-300'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    {/* Conteúdo principal */}
                    <div className="flex items-center gap-3">
                      <div className={`
                        p-2.5 rounded-xl
                        ${isSelected ? 'bg-white/70' : 'bg-gray-50'}
                      `}>
                        <Icon className={`h-6 w-6 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>

                      <div className="text-left">
                        <p className={`font-semibold text-base ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                          {plan.display_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {plan.price > 0 ? (
                            <>R$ {plan.price.toFixed(2)}<span className="text-xs">/mês</span></>
                          ) : (
                            plan.is_admin ? 'Acesso total' : 'Gratuito'
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Indicador de seleção */}
                    {isSelected && (
                      <CheckCircleIcon className="h-6 w-6 text-blue-600" />
                    )}
                  </div>

                  {/* Botão de detalhes */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDetails(isExpanded ? null : plan.id)
                    }}
                    className="absolute bottom-2 right-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {isExpanded ? 'Ocultar' : 'Ver mais'}
                  </button>
                </button>

                {/* Detalhes expandidos - Mobile friendly */}
                {isExpanded && (
                  <div className="mt-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">Recursos incluídos:</p>
                    <ul className="space-y-1">
                      {plan.features?.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Badge admin */}
                {plan.is_admin && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                    Admin
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Mensagem de ajuda - Mobile */}
      <p className="text-xs text-gray-500 text-center mt-3">
        💡 O plano define as funcionalidades disponíveis
      </p>
    </div>
  )
}