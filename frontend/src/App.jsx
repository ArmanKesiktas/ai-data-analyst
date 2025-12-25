import { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import KPICards from './components/KPICards'
import ChartDisplay from './components/ChartDisplay'
import SQLViewer from './components/SQLViewer'
import DataTable from './components/DataTable'
import DataUploader from './components/DataUploader'
import TableViewPage from './components/TableViewPage'
import ReportsPage from './components/ReportsPage'
import TableBuilderPage from './components/TableBuilderPage'
import TableEditorModal from './components/TableEditorModal'
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal'
import OnboardingTour, { useOnboarding } from './components/OnboardingTour'
import LoginPage from './components/LoginPage'
import LandingPage from './components/LandingPage'
import { WorkspaceProvider } from './context/WorkspaceContext'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { MessageSquare, Loader2, Database, ChevronDown } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [error, setError] = useState(null)
  const [question, setQuestion] = useState('')
  const [queryHistory, setQueryHistory] = useState([])
  const [tables, setTables] = useState([])
  const [activeTable, setActiveTable] = useState(null)
  const [showUploader, setShowUploader] = useState(false)
  const [showTableSelector, setShowTableSelector] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard') // 'dashboard' | 'table-view' | 'reports' | 'table-builder'
  const [editingTable, setEditingTable] = useState(null) // Table name being edited
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true) // For mobile responsive
  const [isMobile, setIsMobile] = useState(false)
  const [showLanding, setShowLanding] = useState(true) // Show landing page first

  // Onboarding tour
  const { shouldRun: runOnboarding, completeOnboarding, resetOnboarding } = useOnboarding()

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
      else setSidebarOpen(true)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Clear URL hash from landing page on mount
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'd', ctrl: true, action: () => setCurrentPage('dashboard') },
    { key: 'r', ctrl: true, action: () => setCurrentPage('reports') },
    { key: 't', ctrl: true, action: () => setCurrentPage('table-view') },
    { key: 'b', ctrl: true, action: () => setSidebarOpen(prev => !prev) }, // Toggle sidebar
    { key: '?', shift: true, action: () => setShowShortcuts(true) },
    {
      key: 'Escape', action: () => {
        setShowUploader(false)
        setShowShortcuts(false)
        setEditingTable(null)
        if (isMobile) setSidebarOpen(false)
      }
    }
  ])

  // Load tables
  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tables`)
      setTables(res.data.tables)
      if (res.data.tables.length > 0 && !activeTable) {
        setActiveTable(res.data.tables[0].name)
      }
    } catch (err) {
      console.error('Could not get table list:', err)
    }
  }

  const handleUploadSuccess = (result) => {
    fetchTables()
    setActiveTable(result.table_name)
    setShowUploader(false)
  }

  const handleDeleteTable = async (tableName) => {
    if (!confirm(`Are you sure you want to delete table '${tableName}'?`)) return

    try {
      await axios.delete(`${API_URL}/api/tables/${tableName}`)
      fetchTables()
      if (activeTable === tableName) {
        setActiveTable(tables[0]?.name || null)
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not delete table')
    }
  }

  const handleAnalyze = async (q) => {
    const queryText = q || question
    if (!queryText.trim()) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('question', queryText)
      if (activeTable) {
        formData.append('table_name', activeTable)
      }

      const res = await axios.post(`${API_URL}/api/analyze`, formData)

      if (res.data.success) {
        setResponse(res.data)
        setQueryHistory(prev => [
          { question: queryText, timestamp: new Date(), table: activeTable },
          ...prev.slice(0, 9)
        ])
      } else {
        setError(res.data.error || 'An error occurred')
      }
    } catch (err) {
      console.error('Analysis error:', err)
      if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else if (err.message === 'Network Error') {
        setError('Could not connect to backend server.')
      } else {
        setError('An error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleAnalyze()
    }
  }

  const currentTable = tables.find(t => t.name === activeTable)

  // Get auth state
  const { isAuthenticated, loading: authLoading } = useAuth()

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    // Show landing page first, then login
    if (showLanding) {
      return <LandingPage onGetStarted={() => setShowLanding(false)} />
    }
    return <LoginPage onBack={() => setShowLanding(true)} />
  }

  return (
    <ThemeProvider>
      <WorkspaceProvider>
        <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
          {/* Mobile Overlay */}
          {isMobile && sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 transition-opacity"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar - Slide in on mobile */}
          <div className={`
            ${isMobile ? 'fixed left-0 top-0 h-full z-40' : 'relative'} 
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            transition-transform duration-300 ease-in-out
          `}>
            <Sidebar
              queryHistory={queryHistory}
              tables={tables}
              activeTable={activeTable}
              currentPage={currentPage}
              onPageChange={(page) => {
                setCurrentPage(page)
                if (isMobile) setSidebarOpen(false)
              }}
              onSelectTable={(table) => {
                setActiveTable(table)
                if (isMobile) setSidebarOpen(false)
              }}
              onDeleteTable={handleDeleteTable}
              onUploadClick={() => setShowUploader(true)}
              onSelectQuery={(q) => {
                setQuestion(q)
                setCurrentPage('dashboard')
                handleAnalyze(q)
                if (isMobile) setSidebarOpen(false)
              }}
              onCreateTable={() => {
                setCurrentPage('table-builder')
                if (isMobile) setSidebarOpen(false)
              }}
              onEditTable={(tableName) => setEditingTable(tableName)}
            />
          </div>

          {/* Main Content - min-w-0 prevents flex child from overflowing */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Header */}
            <Header onMenuClick={() => setSidebarOpen(prev => !prev)} />

            {/* Upload Modal */}
            {showUploader && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Upload New Data</h2>
                    <button
                      onClick={() => setShowUploader(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 text-xl"
                    >
                      ×
                    </button>
                  </div>
                  <DataUploader onUploadSuccess={handleUploadSuccess} />
                </div>
              </div>
            )}

            {/* Table Editor Modal */}
            {editingTable && (
              <TableEditorModal
                tableName={editingTable}
                onClose={() => setEditingTable(null)}
                onUpdate={() => {
                  fetchTables()
                  setEditingTable(null)
                }}
              />
            )}

            {/* Page Content */}
            {currentPage === 'table-builder' ? (
              <TableBuilderPage
                onBack={() => setCurrentPage('dashboard')}
                onTableCreated={(tableName) => {
                  fetchTables()
                  setActiveTable(tableName)
                  setCurrentPage('dashboard')
                }}
              />
            ) : currentPage === 'table-view' ? (
              <TableViewPage activeTable={activeTable} tables={tables} />
            ) : currentPage === 'reports' ? (
              <ReportsPage activeTable={activeTable} tables={tables} />
            ) : (
              /* Dashboard Page */
              <main className="flex-1 p-6 overflow-auto">
                {/* Page Title */}
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-gray-500 text-sm">Data analysis and business intelligence</p>
                  </div>

                  {/* Active Table Indicator */}
                  {currentTable && (
                    <div className="relative">
                      <button
                        onClick={() => setShowTableSelector(!showTableSelector)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
                      >
                        <Database className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">{activeTable}</span>
                        <span className="text-xs text-gray-400">({currentTable.row_count} rows)</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </button>

                      {showTableSelector && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                          <div className="p-2">
                            <p className="text-xs text-gray-400 px-2 py-1">Select Table</p>
                            {tables.map(table => (
                              <button
                                key={table.name}
                                onClick={() => {
                                  setActiveTable(table.name)
                                  setShowTableSelector(false)
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${table.name === activeTable
                                  ? 'bg-gray-100 text-gray-900 font-medium'
                                  : 'hover:bg-gray-50 text-gray-700'
                                  }`}
                              >
                                <div className="font-medium">{table.name}</div>
                                <div className="text-xs text-gray-400">
                                  {table.row_count} rows, {table.columns.length} columns
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Search/Question Area */}
                <div className="card p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                    <h2 className="font-semibold text-gray-800">Data Query</h2>
                    {activeTable && (
                      <span className="badge bg-gray-100 text-gray-700 text-xs">{activeTable}</span>
                    )}
                  </div>

                  <div className="flex gap-3 mb-4">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={activeTable
                          ? `Ask a question about "${activeTable}" table...`
                          : "Ask a question about your data..."
                        }
                        className="search-input w-full"
                        disabled={loading}
                      />
                    </div>
                    <button
                      onClick={() => handleAnalyze()}
                      disabled={loading || !question.trim()}
                      className="btn-primary"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <span>Analyze</span>
                      )}
                    </button>
                  </div>

                  {/* Quick Actions */}
                  {currentTable && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-gray-500 mr-2">Suggested queries:</span>
                      <button
                        onClick={() => {
                          const q = `How many total records are in ${activeTable} table?`
                          setQuestion(q)
                          handleAnalyze(q)
                        }}
                        disabled={loading}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        Total records
                      </button>
                      {currentTable.columns.slice(0, 3).map((col, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            const q = `Show distribution by ${col.name} column`
                            setQuestion(q)
                            handleAnalyze(q)
                          }}
                          disabled={loading}
                          className="btn-secondary text-xs py-1.5 px-3"
                        >
                          {col.name} distribution
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="card p-4 mb-6 border-gray-300 bg-gray-50 animate-fadeIn">
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Error</span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{error}</p>
                  </div>
                )}

                {/* Results */}
                {response && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Explanation Card */}
                    {response.explanation && (
                      <div className="card p-6">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 mb-2">Analysis Result</h3>
                            <p className="text-gray-600 leading-relaxed">{response.explanation}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* KPI Cards */}
                    {response.kpis && Object.keys(response.kpis).length > 0 && (
                      <KPICards kpis={response.kpis} />
                    )}

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {response.data && response.data.length > 0 && response.chart_config && (
                        <ChartDisplay
                          data={response.data}
                          config={response.chart_config}
                        />
                      )}
                      {response.sql && (
                        <SQLViewer sql={response.sql} />
                      )}
                    </div>

                    {/* Data Table */}
                    {response.data && response.data.length > 0 && (
                      <DataTable data={response.data} />
                    )}
                  </div>
                )}

                {/* Skeleton Loading State */}
                {loading && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Skeleton Explanation Card */}
                    <div className="card p-6">
                      <div className="flex items-start gap-3">
                        <div className="skeleton-shimmer w-10 h-10 rounded-xl flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="skeleton-shimmer h-5 w-32 rounded mb-3"></div>
                          <div className="skeleton-shimmer h-4 w-full rounded mb-2"></div>
                          <div className="skeleton-shimmer h-4 w-3/4 rounded"></div>
                        </div>
                      </div>
                    </div>

                    {/* Skeleton KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="card p-4">
                          <div className="skeleton-shimmer h-3 w-20 rounded mb-3"></div>
                          <div className="skeleton-shimmer h-8 w-28 rounded"></div>
                        </div>
                      ))}
                    </div>

                    {/* Skeleton Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="card p-4">
                        <div className="skeleton-shimmer h-4 w-32 rounded mb-4"></div>
                        <div className="skeleton-shimmer h-48 w-full rounded"></div>
                      </div>
                      <div className="card p-4">
                        <div className="skeleton-shimmer h-4 w-28 rounded mb-4"></div>
                        <div className="skeleton-shimmer h-48 w-full rounded"></div>
                      </div>
                    </div>

                    {/* Skeleton Table */}
                    <div className="card p-4">
                      <div className="skeleton-shimmer h-4 w-24 rounded mb-4"></div>
                      <div className="space-y-2">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div key={i} className="skeleton-shimmer h-10 w-full rounded"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!response && !error && !loading && (
                  <div className="card p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Start Data Analysis</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      {tables.length === 0
                        ? "Upload a data file to get started (CSV or Excel)."
                        : "Type your question in the field above or select one of the suggested queries."
                      }
                    </p>
                    {tables.length === 0 ? (
                      <button
                        onClick={() => setShowUploader(true)}
                        className="btn-primary mx-auto"
                      >
                        Upload Data
                      </button>
                    ) : (
                      <div className="flex justify-center gap-3">
                        <span className="badge bg-gray-100 text-gray-600">Dynamic Schema</span>
                        <span className="badge bg-gray-100 text-gray-600">CSV/Excel Support</span>
                        <span className="badge bg-gray-100 text-gray-600">{tables.length} Tables</span>
                      </div>
                    )}
                  </div>
                )}
              </main>
            )}
          </div>
        </div>

        {/* Modals */}
        {showShortcuts && (
          <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
        )}

        {/* Onboarding Tour */}
        <OnboardingTour run={runOnboarding} onComplete={completeOnboarding} />
      </WorkspaceProvider>
    </ThemeProvider>
  )
}

export default App

