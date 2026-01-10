import { useEffect, useState } from 'react'
import { fetchRecentFeatures, parseFeaturesForRecords } from './api/itbi'
import SearchBar from './components/SearchBar'
import PriceChart from './components/PriceChart'
import Insights from './components/Insights'

export default function App() {
  const [records, setRecords] = useState<any[]>([])
  const [selectedStreet, setSelectedStreet] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [propertyType, setPropertyType] = useState<'residential' | 'commercial'>('residential')

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const features = await fetchRecentFeatures()
        const parsed = parseFeaturesForRecords(features)
        setRecords(parsed)
      } catch (err) {
        console.error('Failed to load ITBI data', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Filter records by property type and exclude parking spaces
  const filteredRecords = records.filter((r) => {
    // Filter out parking spaces from "principais tipologias" column
    const principaisTipologias = (r.raw?.principais_tipologias || r.raw?.['principais_tipologias'] || '').toUpperCase()
    if (principaisTipologias === 'VAGA DE GARAGEM') {
      return false
    }

    // Exact match on uso column
    const uso = (r.uso || '').toUpperCase().trim()
    if (propertyType === 'residential') {
      // Exactly RESIDENCIAL
      return uso === 'RESIDENCIAL'
    } else {
      // Exactly NAO RESIDENCIAL
      return uso === 'NAO RESIDENCIAL'
    }
  })

  const theme = propertyType === 'residential'
    ? {
        bgGradient: 'from-blue-50 via-slate-50 to-purple-50',
        titleGradient: 'from-blue-600 to-purple-600',
        primary: 'blue',
        secondary: 'purple'
      }
    : {
        bgGradient: 'from-red-50 via-slate-50 to-orange-50',
        titleGradient: 'from-red-600 to-orange-600',
        primary: 'red',
        secondary: 'orange'
      }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bgGradient} text-slate-900`}>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-12">
        <header className="mb-6 sm:mb-12 text-center">
          <h1 className={`text-3xl sm:text-5xl font-bold bg-gradient-to-r ${theme.titleGradient} bg-clip-text text-transparent mb-2 sm:mb-3`}>
            Preço m² São Paulo
          </h1>
          <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto px-2">
            Consulte o <strong>valor do metro quadrado</strong> de imóveis em São Paulo por bairro. Análise de <strong>tendências do mercado imobiliário</strong> com dados oficiais ITBI dos últimos 24 meses.
          </p>

          {/* Property Type Toggle */}
          <div className="mt-6 sm:mt-8 flex justify-center">
            <div className="bg-white rounded-full p-1 shadow-md inline-flex">
              <button
                onClick={() => setPropertyType('residential')}
                className={`px-6 sm:px-8 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-semibold transition-all ${
                  propertyType === 'residential'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Residencial
              </button>
              <button
                onClick={() => setPropertyType('commercial')}
                className={`px-6 sm:px-8 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-semibold transition-all ${
                  propertyType === 'commercial'
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Comercial
              </button>
            </div>
          </div>
        </header>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20">
            <div className="animate-spin rounded-full h-12 sm:h-16 w-12 sm:w-16 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-slate-600 text-base sm:text-lg text-center px-4">Carregando dados da Prefeitura de São Paulo...</p>
            <p className="text-slate-500 text-xs sm:text-sm mt-2">Isso pode levar alguns instantes</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 sm:p-6 rounded-lg shadow-sm mb-6 sm:mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-base sm:text-lg font-semibold text-red-800">Erro ao Carregar Dados</h3>
                <p className="text-sm sm:text-base text-red-700 mt-1">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-8 mb-6 sm:mb-8">
              <SearchBar
                records={filteredRecords}
                onSelectStreet={(s) => setSelectedStreet(s)}
                theme={theme}
              />
            </div>

            {selectedStreet && (
              <div className="space-y-4 sm:space-y-6">
                <PriceChart records={filteredRecords} street={selectedStreet} theme={theme} />
                <Insights records={filteredRecords} street={selectedStreet} theme={theme} />
              </div>
            )}

            {!selectedStreet && filteredRecords.length > 0 && (
              <div className="text-center py-8 sm:py-12 px-4">
                <svg className="mx-auto h-16 sm:h-24 w-16 sm:w-24 text-slate-300 mb-3 sm:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-slate-500 text-base sm:text-lg">
                  <strong>Busque sua rua</strong> para consultar o preço do m² e valorização de imóveis
                </p>
                <p className="text-slate-400 text-xs sm:text-sm mt-2">
                  {filteredRecords.length.toLocaleString('pt-BR')} transações de imóveis disponíveis
                </p>
              </div>
            )}
          </>
        )}

        <footer className="mt-8 sm:mt-12 text-center text-xs sm:text-sm text-slate-500 border-t border-slate-200 pt-6 sm:pt-8 space-y-2">
          <p className="font-medium">Fonte de dados: <a href="https://dados.prefeitura.sp.gov.br/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Dados Abertos SP</a> - Prefeitura de São Paulo (ITBI - Imposto de Transmissão de Bens Imóveis)</p>
          <p className="text-xs">Preços por metro quadrado atualizados em tempo real com base nos registros oficiais de transações imobiliárias da cidade de São Paulo</p>
          <p className="text-slate-400 pt-2">
            Criado por <a href="https://github.com/marcelofprado" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Marcelo Prado</a>
          </p>
        </footer>
      </div>
    </div>
  )
}
