import { useState, useEffect } from 'react'
import api from '@/services/api'

interface AccessPlan {
  id: number
  name: string
  display_name: string
  level: number
  price: number
  is_admin: boolean
}

interface PlanDropdownProps {
  value?: number
  onChange: (planId: number) => void
  disabled?: boolean
  required?: boolean
  className?: string
}

export function PlanDropdown({
  value,
  onChange,
  disabled = false,
  required = false,
  className = ''
}: PlanDropdownProps) {
  const [plans, setPlans] = useState<AccessPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const response = await api.get('/access-plans')
      setPlans(response.data || [])
    } catch (error) {
      // Planos padrão se falhar
      setPlans([
        { id: 1, name: 'basic', display_name: 'Básico', level: 1, price: 0, is_admin: false },
        { id: 2, name: 'standard', display_name: 'Standard', level: 2, price: 49.90, is_admin: false },
        { id: 3, name: 'premium', display_name: 'Premium', level: 3, price: 99.90, is_admin: false },
        { id: 4, name: 'admin', display_name: 'Administrador', level: 4, price: 0, is_admin: true }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Plano de Acesso {required && <span className="text-red-500">*</span>}
      </label>

      <select
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled || loading}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-lg
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${className}
        `}
      >
        <option value="">Selecione um plano...</option>
        {plans.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.display_name}
            {plan.price > 0 && ` - R$ ${plan.price.toFixed(2)}/mês`}
            {plan.is_admin && ' (Admin)'}
          </option>
        ))}
      </select>

      <p className="text-xs text-gray-500 mt-1">
        Define as funcionalidades disponíveis para o usuário
      </p>
    </div>
  )
}