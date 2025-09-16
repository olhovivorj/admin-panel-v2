import { useState } from 'react'
import { PlusIcon, TrashIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/common/Button'
import { toast } from 'react-hot-toast'

interface IpWhitelistFieldProps {
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}

export function IpWhitelistField({ value = [], onChange, disabled = false }: IpWhitelistFieldProps) {
  const [newIp, setNewIp] = useState('')
  const [showHelp, setShowHelp] = useState(false)

  const validateIp = (ip: string): boolean => {
    // Regex para validar IPv4 com ou sem CIDR
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/
    
    if (!ipRegex.test(ip)) {
      return false
    }
    
    // Validar octetos
    const parts = ip.split('/')
    const octets = parts[0].split('.')
    
    for (const octet of octets) {
      const num = parseInt(octet)
      if (num < 0 || num > 255) {
        return false
      }
    }
    
    // Validar CIDR se presente
    if (parts[1]) {
      const cidr = parseInt(parts[1])
      if (cidr < 0 || cidr > 32) {
        return false
      }
    }
    
    return true
  }

  const handleAdd = () => {
    const trimmedIp = newIp.trim()
    
    if (!trimmedIp) {
      toast.error('Digite um IP válido')
      return
    }
    
    if (!validateIp(trimmedIp)) {
      toast.error('IP inválido. Use formato: 192.168.1.1 ou 192.168.1.0/24')
      return
    }
    
    if (value.includes(trimmedIp)) {
      toast.error('Este IP já está na lista')
      return
    }
    
    onChange([...value, trimmedIp])
    setNewIp('')
    toast.success('IP adicionado')
  }

  const handleRemove = (ip: string) => {
    onChange(value.filter(item => item !== ip))
    toast.success('IP removido')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          IP Whitelist
        </label>
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          <InformationCircleIcon className="h-5 w-5" />
        </button>
      </div>

      {showHelp && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
          <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            Como funciona o IP Whitelist:
          </p>
          <ul className="space-y-1 text-blue-700 dark:text-blue-300">
            <li>• <strong>IP individual:</strong> 189.45.123.100</li>
            <li>• <strong>CIDR range:</strong> 192.168.1.0/24 (256 IPs)</li>
            <li>• <strong>Vazio:</strong> Aceita qualquer IP (não recomendado)</li>
          </ul>
          <p className="mt-2 text-blue-600 dark:text-blue-400">
            💡 Use CIDR para IPs dinâmicos do provedor
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newIp}
          onChange={(e) => setNewIp(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ex: 192.168.1.100 ou 192.168.1.0/24"
          disabled={disabled}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled}
        >
          <PlusIcon className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {value.length > 0 ? (
        <div className="space-y-2">
          {value.map((ip) => (
            <div
              key={ip}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <code className="text-sm font-mono text-gray-900 dark:text-gray-100">
                {ip}
              </code>
              <button
                type="button"
                onClick={() => handleRemove(ip)}
                disabled={disabled}
                className="text-red-600 hover:text-red-700 dark:text-red-400 disabled:opacity-50"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          Nenhum IP cadastrado (aceita de qualquer origem)
        </p>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        ⚠️ Restrinja o acesso apenas a IPs confiáveis para maior segurança
      </p>
    </div>
  )
}