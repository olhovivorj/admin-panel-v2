import { UseFormRegister } from 'react-hook-form'

interface LimitesAcessoTabProps {
  register: UseFormRegister<any>
}

export const LimitesAcessoTab = ({ register }: LimitesAcessoTabProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Limites e Controle de Acesso
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Rate Limit (por hora)
        </label>
        <input
          {...register('rate_limit_per_hour', { valueAsNumber: true })}
          type="number"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
          placeholder="1000"
        />
        <p className="mt-1 text-xs text-gray-500">
          Número máximo de requisições por hora para este usuário API
        </p>
      </div>

      {/* TODO: IP Whitelist */}
      {/* TODO: API Keys */}
      {/* TODO: Endpoints permitidos */}
    </div>
  )
}
