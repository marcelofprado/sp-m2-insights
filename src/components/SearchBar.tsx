import { useMemo, useState } from 'react'

type SuggestionItem = {
  address: string
  bairro: string
}

type Theme = {
  bgGradient: string
  titleGradient: string
  primary: string
  secondary: string
}

export default function SearchBar({ records, onSelectStreet, theme }: { records: any[]; onSelectStreet: (s: string) => void; theme: Theme }) {
  const [q, setQ] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const getColorClasses = () => {
    if (theme.primary === 'blue') {
      return {
        inputFocus: 'focus:border-blue-500 focus:ring-blue-200',
        button: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
        suggestionHover: 'hover:bg-blue-50 hover:text-blue-700'
      }
    } else {
      return {
        inputFocus: 'focus:border-red-500 focus:ring-red-200',
        button: 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700',
        suggestionHover: 'hover:bg-red-50 hover:text-red-700'
      }
    }
  }

  const colors = getColorClasses()

  const suggestions = useMemo(() => {
    if (!q || q.length < 2) return []
    const s = q.trim().toLowerCase()
    const uniquesMap = new Map<string, SuggestionItem>()
    for (const r of records) {
      if (!r.address) continue
      if (r.address.toLowerCase().includes(s)) {
        if (!uniquesMap.has(r.address)) {
          uniquesMap.set(r.address, { address: r.address, bairro: r.bairro || '' })
        }
      }
      if (uniquesMap.size >= 12) break
    }
    return Array.from(uniquesMap.values())
  }, [q, records])

  const submit = (s: string) => {
    setQ(s)
    onSelectStreet(s)
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && q.trim()) {
      submit(q)
    }
  }

  return (
    <div className="relative">
      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">
        Buscar valor m² por rua e bairro em São Paulo
      </label>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border-2 border-slate-200 rounded-xl ${colors.inputFocus} focus:ring-2 transition-all outline-none text-base sm:text-lg`}
            placeholder="Ex: Av. Paulista, Jardins, Vila Madalena..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setShowSuggestions(true)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            aria-label="Buscar preço metro quadrado por rua em São Paulo"
          />
        </div>
        <button
          onClick={() => submit(q)}
          disabled={!q.trim()}
          className={`w-full sm:w-auto px-6 py-2.5 sm:py-3 ${colors.button} text-white rounded-xl font-semibold disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-sm sm:text-base`}
          aria-label="Consultar preço"
        >
          Consultar Preço
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 max-h-60 sm:max-h-80 overflow-y-auto">
          <div className="p-2">
            <p className="text-xs text-slate-500 px-3 py-2 font-medium">Sugestões</p>
            <ul className="space-y-1">
              {suggestions.map((s) => (
                <li
                  key={s.address}
                  className={`cursor-pointer text-slate-700 px-3 py-2 sm:py-2.5 rounded-lg ${colors.suggestionHover} transition-colors flex items-center gap-2 text-sm sm:text-base`}
                  onClick={() => submit(s.address)}
                >
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex-1 truncate">
                    <span className="text-slate-800">{s.address}</span>
                    {s.bairro && <span className="text-slate-400 text-xs sm:text-sm ml-2">• {s.bairro}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {showSuggestions && q.length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-3 sm:p-4">
          <p className="text-slate-500 text-xs sm:text-sm">Nenhuma rua ou bairro encontrado com "{q}". Tente buscar por outra localização em São Paulo.</p>
        </div>
      )}
    </div>
  )
}
