import React, { useState, useEffect, useCallback } from 'react'
import {
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlusIcon,
  XMarkIcon,
  CalendarIcon,
  ShoppingCartIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import api from '@/services/api'
import toast from 'react-hot-toast'

interface AgendamentoConfig {
  tipo: string
  habilitado: boolean
  cronExpression: string
  descricao: string
  proximaExecucao: string | null
}

interface Horario {
  hora: string
  minuto: string
}

// Tipos de agendamento disponíveis
type TipoAgendamento = 'sync' | 'ecommerce' | 'sao' | 'compliance'

interface TipoConfig {
  id: TipoAgendamento
  label: string
  descricao: string
  icon: React.ReactNode
  modoIntervalo: boolean // true = segundos/minutos, false = horários específicos
  unidadeIntervalo?: 'segundos' | 'minutos'
  defaultCron: string
  defaultIntervalo: number
}

const TIPOS_AGENDAMENTO: TipoConfig[] = [
  {
    id: 'sync',
    label: 'Sync (Produtos)',
    descricao: 'Sincronizacao de produtos e precos do catalogo Zeiss',
    icon: <ArrowPathIcon className="w-4 h-4" />,
    modoIntervalo: false,
    defaultCron: '0 3 * * *',
    defaultIntervalo: 0,
  },
  {
    id: 'ecommerce',
    label: 'E-commerce (Estoque)',
    descricao: 'Atualizacao de estoque no marketplace Zeiss',
    icon: <ShoppingCartIcon className="w-4 h-4" />,
    modoIntervalo: true,
    unidadeIntervalo: 'segundos',
    defaultCron: '*/10 * * * * *',
    defaultIntervalo: 10,
  },
  {
    id: 'sao',
    label: 'SAO (Pedidos)',
    descricao: 'Monitoramento de status de pedidos de producao',
    icon: <DocumentTextIcon className="w-4 h-4" />,
    modoIntervalo: true,
    unidadeIntervalo: 'minutos',
    defaultCron: '*/5 * * * *',
    defaultIntervalo: 5,
  },
  {
    id: 'compliance',
    label: 'Compliance (ZVC)',
    descricao: 'Envio de dados de sellout para Zeiss Vision Center',
    icon: <ChartBarIcon className="w-4 h-4" />,
    modoIntervalo: false,
    defaultCron: '0 6 * * *',
    defaultIntervalo: 0,
  },
]

const DIAS_SEMANA = [
  { id: '1', label: 'Seg' },
  { id: '2', label: 'Ter' },
  { id: '3', label: 'Qua' },
  { id: '4', label: 'Qui' },
  { id: '5', label: 'Sex' },
  { id: '6', label: 'Sab' },
  { id: '0', label: 'Dom' },
]

export function Schedules() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<TipoAgendamento | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TipoAgendamento>('sync')

  // Estado para cada tipo de agendamento
  const [configs, setConfigs] = useState<Record<TipoAgendamento, AgendamentoConfig | null>>({
    sync: null,
    ecommerce: null,
    sao: null,
    compliance: null,
  })

  // Estados editáveis para cada tipo
  const [habilitados, setHabilitados] = useState<Record<TipoAgendamento, boolean>>({
    sync: true,
    ecommerce: false,
    sao: false,
    compliance: false,
  })

  const [intervalos, setIntervalos] = useState<Record<TipoAgendamento, number>>({
    sync: 0,
    ecommerce: 10,
    sao: 5,
    compliance: 0,
  })

  const [horarios, setHorarios] = useState<Record<TipoAgendamento, Horario[]>>({
    sync: [{ hora: '03', minuto: '00' }],
    ecommerce: [],
    sao: [],
    compliance: [{ hora: '06', minuto: '00' }],
  })

  const [diasSemana, setDiasSemana] = useState<Record<TipoAgendamento, string[]>>({
    sync: ['1', '2', '3', '4', '5', '6', '0'],
    ecommerce: [],
    sao: [],
    compliance: ['1', '2', '3', '4', '5', '6', '0'],
  })

  const parseIntervaloFromCron = (cron: string, unidade: 'segundos' | 'minutos'): number => {
    const partes = cron.split(' ')
    if (unidade === 'segundos' && partes.length === 6) {
      const match = partes[0].match(/\*\/(\d+)/)
      return match ? parseInt(match[1], 10) : 10
    } else if (unidade === 'minutos') {
      const match = partes[0].match(/\*\/(\d+)/)
      return match ? parseInt(match[1], 10) : 5
    }
    return 10
  }

  const parseCronExpression = (cron: string, tipo: TipoAgendamento) => {
    const partes = cron.split(' ')
    if (partes.length !== 5) return

    const [min, hora, , , diaSemana] = partes

    // Parse horarios
    const horas = hora.split(',')
    const novosHorarios: Horario[] = horas.map(h => ({
      hora: h.padStart(2, '0'),
      minuto: min.padStart(2, '0'),
    }))
    setHorarios(prev => ({ ...prev, [tipo]: novosHorarios }))

    // Parse dias da semana
    let novosDias: string[]
    if (diaSemana === '*') {
      novosDias = ['0', '1', '2', '3', '4', '5', '6']
    } else if (diaSemana.includes('-')) {
      const [start, end] = diaSemana.split('-').map(Number)
      novosDias = []
      for (let i = start; i <= end; i++) {
        novosDias.push(i.toString())
      }
    } else if (diaSemana.includes(',')) {
      novosDias = diaSemana.split(',')
    } else {
      novosDias = [diaSemana]
    }
    setDiasSemana(prev => ({ ...prev, [tipo]: novosDias }))
  }

  const fetchAllConfigs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/schedules/sync-configs')
      const data = res.data

      if (Array.isArray(data)) {
        const newConfigs: Record<TipoAgendamento, AgendamentoConfig | null> = {
          sync: null,
          ecommerce: null,
          sao: null,
          compliance: null,
        }

        for (const config of data) {
          const tipo = config.tipo as TipoAgendamento
          if (TIPOS_AGENDAMENTO.some(t => t.id === tipo)) {
            newConfigs[tipo] = {
              tipo: config.tipo,
              habilitado: config.habilitado,
              cronExpression: config.cron_expression,
              descricao: config.descricao || '',
              proximaExecucao: null,
            }

            setHabilitados(prev => ({ ...prev, [tipo]: config.habilitado }))

            const tipoConfig = TIPOS_AGENDAMENTO.find(t => t.id === tipo)
            if (tipoConfig?.modoIntervalo) {
              const intervalo = parseIntervaloFromCron(config.cron_expression, tipoConfig.unidadeIntervalo!)
              setIntervalos(prev => ({ ...prev, [tipo]: intervalo }))
            } else {
              parseCronExpression(config.cron_expression, tipo)
            }
          }
        }

        setConfigs(newConfigs)
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllConfigs()
  }, [fetchAllConfigs])

  const buildCronExpression = (tipo: TipoAgendamento): string => {
    const tipoConfig = TIPOS_AGENDAMENTO.find(t => t.id === tipo)

    if (tipoConfig?.modoIntervalo) {
      const intervalo = intervalos[tipo]
      if (tipoConfig.unidadeIntervalo === 'segundos') {
        return `*/${intervalo} * * * * *`
      } else {
        return `*/${intervalo} * * * *`
      }
    }

    // Modo horários específicos
    const tipoHorarios = horarios[tipo]
    const tipoDias = diasSemana[tipo]

    const minuto = tipoHorarios[0]?.minuto || '0'
    const horas = tipoHorarios.map(h => parseInt(h.hora, 10)).join(',')

    let diasStr = '*'
    if (tipoDias.length < 7 && tipoDias.length > 0) {
      const sorted = [...tipoDias].map(Number).sort((a, b) => a - b)
      const isRange = sorted.every((v, i) => i === 0 || v === sorted[i - 1] + 1)

      if (isRange && sorted.length > 2) {
        diasStr = `${sorted[0]}-${sorted[sorted.length - 1]}`
      } else {
        diasStr = sorted.join(',')
      }
    }

    return `${minuto} ${horas} * * ${diasStr}`
  }

  const handleSave = async (tipo: TipoAgendamento) => {
    setSaving(tipo)
    setError(null)
    setSuccess(null)

    try {
      const cron = buildCronExpression(tipo)
      const habilitado = habilitados[tipo]

      await api.put(`/schedules/sync-configs/${tipo}`, {
        cron_expression: cron,
        habilitado,
      })

      setConfigs(prev => ({
        ...prev,
        [tipo]: {
          tipo,
          habilitado,
          cronExpression: cron,
          descricao: TIPOS_AGENDAMENTO.find(t => t.id === tipo)?.descricao || '',
          proximaExecucao: null,
        },
      }))

      const tipoLabel = TIPOS_AGENDAMENTO.find(t => t.id === tipo)?.label
      setSuccess(`Agendamento "${tipoLabel}" salvo com sucesso!`)
      toast.success(`Agendamento "${tipoLabel}" salvo!`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar')
      toast.error('Erro ao salvar agendamento')
    } finally {
      setSaving(null)
    }
  }

  const addHorario = (tipo: TipoAgendamento) => {
    setHorarios(prev => ({
      ...prev,
      [tipo]: [...prev[tipo], { hora: '03', minuto: '00' }],
    }))
  }

  const removeHorario = (tipo: TipoAgendamento, index: number) => {
    if (horarios[tipo].length > 1) {
      setHorarios(prev => ({
        ...prev,
        [tipo]: prev[tipo].filter((_, i) => i !== index),
      }))
    }
  }

  const updateHorario = (tipo: TipoAgendamento, index: number, field: 'hora' | 'minuto', value: string) => {
    setHorarios(prev => {
      const updated = [...prev[tipo]]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, [tipo]: updated }
    })
  }

  const toggleDia = (tipo: TipoAgendamento, dia: string) => {
    const tipoDias = diasSemana[tipo]
    if (tipoDias.includes(dia)) {
      if (tipoDias.length > 1) {
        setDiasSemana(prev => ({
          ...prev,
          [tipo]: prev[tipo].filter(d => d !== dia),
        }))
      }
    } else {
      setDiasSemana(prev => ({
        ...prev,
        [tipo]: [...prev[tipo], dia],
      }))
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  const activeTipoConfig = TIPOS_AGENDAMENTO.find(t => t.id === activeTab)!
  const activeConfig = configs[activeTab]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClockIcon className="w-7 h-7" />
            Agendamentos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure os agendamentos de cada modulo de integracao
          </p>
        </div>
        <button
          onClick={fetchAllConfigs}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
          <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm">
          <CheckCircleIcon className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Tabs */}
        <div className="border-b dark:border-gray-700">
          <div className="flex flex-wrap gap-1 px-4">
            {TIPOS_AGENDAMENTO.map(tipo => (
              <button
                key={tipo.id}
                onClick={() => setActiveTab(tipo.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tipo.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tipo.icon}
                <span>{tipo.label}</span>
                {configs[tipo.id]?.habilitado && (
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6">
          {/* Descricao do tipo */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              {activeTipoConfig.descricao}
            </p>
          </div>

          {/* Status Card */}
          {activeConfig && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Proxima execucao
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(activeConfig.proximaExecucao)}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  activeConfig.habilitado
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                }`}>
                  {activeConfig.habilitado ? 'Ativo' : 'Inativo'}
                </div>
              </div>
            </div>
          )}

          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {activeTipoConfig.label}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Habilitar execucao automatica
              </p>
            </div>
            <button
              onClick={() => setHabilitados(prev => ({ ...prev, [activeTab]: !prev[activeTab] }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                habilitados[activeTab] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                habilitados[activeTab] ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Configuracao de intervalo (para ecommerce e sao) */}
          {activeTipoConfig.modoIntervalo && (
            <div className="p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg space-y-4">
              <p className="font-medium text-gray-900 dark:text-white">
                Intervalo de execucao
              </p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">A cada</span>
                <input
                  type="number"
                  min="1"
                  max={activeTipoConfig.unidadeIntervalo === 'segundos' ? 59 : 60}
                  value={intervalos[activeTab]}
                  onChange={(e) => setIntervalos(prev => ({
                    ...prev,
                    [activeTab]: parseInt(e.target.value, 10) || 1
                  }))}
                  className="w-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {activeTipoConfig.unidadeIntervalo}
                </span>
              </div>
            </div>
          )}

          {/* Horarios (para sync e compliance) */}
          {!activeTipoConfig.modoIntervalo && (
            <>
              <div className="p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 dark:text-white">Horarios</p>
                  <button
                    onClick={() => addHorario(activeTab)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Adicionar
                  </button>
                </div>

                <div className="space-y-2">
                  {horarios[activeTab].map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select
                        value={h.hora}
                        onChange={(e) => updateHorario(activeTab, i, 'hora', e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                      <span className="text-gray-500">:</span>
                      <select
                        value={h.minuto}
                        onChange={(e) => updateHorario(activeTab, i, 'minuto', e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {['00', '15', '30', '45'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      {horarios[activeTab].length > 1 && (
                        <button
                          onClick={() => removeHorario(activeTab, i)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dias da Semana */}
              <div className="p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg space-y-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <p className="font-medium text-gray-900 dark:text-white">Dias da Semana</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map(dia => (
                    <button
                      key={dia.id}
                      onClick={() => toggleDia(activeTab, dia.id)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        diasSemana[activeTab].includes(dia.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {dia.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Preview */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Expressao cron gerada:</p>
            <code className="text-sm font-mono text-gray-900 dark:text-white">
              {buildCronExpression(activeTab)}
            </code>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t dark:border-gray-700">
            <button
              onClick={() => handleSave(activeTab)}
              disabled={saving !== null}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving === activeTab ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <CheckIcon className="w-4 h-4" />
              )}
              Salvar {activeTipoConfig.label}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
