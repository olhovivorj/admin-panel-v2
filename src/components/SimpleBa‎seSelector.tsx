import { useBase } from '@/contexts/BaseContext'

export function SimpleBaseSelector() {
  const { bases, selectedBase, isLoading, selectBase } = useBase()

  if (isLoading) {
    return <div className="text-xs text-gray-500">Carregando bases...</div>
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600">Base:</span>
      <select
        value={selectedBase?.BASE || ''}
        onChange={(e) => selectBase(e.target.value)}
        className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
      >
        <option value="">Selecione...</option>
        {bases.map((base) => (
          <option key={base.BASE} value={base.BASE}>
            {base.NOME} ({base.BASE})
          </option>
        ))}
      </select>
    </div>
  )
}