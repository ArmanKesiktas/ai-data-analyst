import { useState } from 'react'
import {
    LayoutDashboard,
    Table2,
    Clock,
    Database,
    Plus,
    Trash2,
    ChevronDown,
    ChevronRight,
    Sparkles,
    Pencil,
    TableProperties,
    Copy
} from 'lucide-react'

export default function Sidebar({
    queryHistory,
    tables,
    activeTable,
    currentPage,
    onPageChange,
    onSelectTable,
    onDeleteTable,
    onUploadClick,
    onSelectQuery,
    onCreateTable,
    onEditTable,
    onCopyTable
}) {
    const [showTables, setShowTables] = useState(true)
    const [showHistory, setShowHistory] = useState(true)

    return (
        <aside data-tour="sidebar" className="w-64 border-r flex flex-col" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            {/* Logo */}
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex flex-col items-center">
                    <img src="/quantyblack.png" alt="Quanty Logo" className="h-8 w-auto object-contain" />
                    <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Measure what matters</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="p-3 flex-1 overflow-auto">
                <div className="space-y-1 mb-6">
                    <button
                        onClick={() => onPageChange('dashboard')}
                        data-tour="query-page"
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${currentPage === 'dashboard'
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        Query
                    </button>
                    <button
                        onClick={() => onPageChange('table-view')}
                        data-tour="data-view"
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${currentPage === 'table-view'
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Table2 className="w-4 h-4" />
                        Data View
                    </button>
                    <button
                        onClick={() => onPageChange('reports')}
                        data-tour="dashboard"
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${currentPage === 'reports'
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </button>
                </div>

                {/* Tables Section */}
                <div className="mb-4" data-tour="data-sources">
                    <button
                        onClick={() => setShowTables(!showTables)}
                        className="flex items-center gap-2 w-full text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-2"
                    >
                        {showTables ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        Data Sources
                        <div className="ml-auto flex items-center gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); if (onCreateTable) onCreateTable(); }}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Create Table"
                            >
                                <TableProperties className="w-3 h-3" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onUploadClick(); }}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Upload File"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </button>

                    <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${showTables ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                            }`}
                    >
                        <div className="space-y-1 mt-1">
                            {tables.map(table => (
                                <div
                                    key={table.name}
                                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${activeTable === table.name
                                        ? 'bg-gray-100 text-gray-900'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    onClick={() => onSelectTable(table.name)}
                                >
                                    <Database className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="truncate flex-1">{table.name}</span>
                                    <span className="text-xs text-gray-400">{table.row_count} rows</span>
                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); if (onCopyTable) onCopyTable(table.name); }}
                                            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-blue-600"
                                            title="Copy to workspace"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); if (onEditTable) onEditTable(table.name); }}
                                            className="p-1 hover:bg-gray-200 rounded text-gray-400"
                                            title="Edit table"
                                        >
                                            <Pencil className="w-3 h-3" />
                                        </button>
                                        {table.name !== 'sales' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteTable(table.name); }}
                                                className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-600"
                                                title="Delete table"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Query History */}
                <div>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 w-full text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-2"
                    >
                        {showHistory ? <ChevronDown className="w-3 h-3 transition-transform" /> : <ChevronRight className="w-3 h-3 transition-transform" />}
                        Recent Queries
                    </button>

                    <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${showHistory && queryHistory.length > 0 ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
                            }`}
                    >
                        <div className="space-y-1 mt-1">
                            {queryHistory.slice(0, 5).map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onSelectQuery(item.question)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors text-left"
                                >
                                    <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{item.question}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">Quanty AI</span>
                    <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded">{tables?.length || 0} tables</span>
                </div>
            </div>
        </aside>
    )
}
