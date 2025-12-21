import { useState } from 'react'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
}

interface TabPanelProps {
  tabs: Tab[]
  children: React.ReactNode[]
  defaultTab?: string
}

export function TabPanel({ tabs, children, defaultTab }: TabPanelProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '')

  const activeIndex = tabs.findIndex(tab => tab.id === activeTab)

  return (
    <div className="space-y-4">
      {/* Abas - Mobile optimized */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm
                transition-colors flex items-center gap-2
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo da aba ativa */}
      <div className="mt-4">
        {children[activeIndex]}
      </div>
    </div>
  )
}