import { useState, useEffect, useCallback, useRef } from 'react'
import { Table, Download, ChevronLeft, ChevronRight, Search, RefreshCw, Filter, Columns, Plus, Pencil, Trash2, FileSpreadsheet } from 'lucide-react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import RowEditorModal from './RowEditorModal'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 300

export default function TableViewPage({ activeTable, tables }) {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [totalRows, setTotalRows] = useState(0)
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
    const [visibleColumns, setVisibleColumns] = useState([])
    const [showColumnSelector, setShowColumnSelector] = useState(false)
    const [showRowEditor, setShowRowEditor] = useState(false)
    const [editingRow, setEditingRow] = useState(null)
    const [tableColumns, setTableColumns] = useState([])

    // Debounce timer ref
    const searchTimeoutRef = useRef(null)

    // Debounce search input
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }
        searchTimeoutRef.current = setTimeout(() => {
            setDebouncedSearch(searchTerm)
            setPage(0) // Reset to first page on search
        }, SEARCH_DEBOUNCE_MS)

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [searchTerm])

    // Fetch data with server-side sorting, filtering, and pagination
    const fetchTableData = useCallback(async () => {
        if (!activeTable) return

        setLoading(true)
        setError(null)

        try {
            // Get table schema for column info
            const schemaRes = await axios.get(`${API_URL}/api/tables/${activeTable}`)
            setTableColumns(schemaRes.data.schema || [])

            // Build query params for server-side operations
            const params = new URLSearchParams({
                page: page.toString(),
                page_size: PAGE_SIZE.toString()
            })

            if (sortConfig.key) {
                params.append('sort_by', sortConfig.key)
                params.append('sort_order', sortConfig.direction)
            }

            if (debouncedSearch) {
                params.append('search', debouncedSearch)
            }

            // Get rows with server-side sorting and filtering
            const res = await axios.get(`${API_URL}/api/tables/${activeTable}/rows?${params}`)
            const responseData = res.data.data || []

            setData(responseData)
            setTotalPages(res.data.total_pages || 1)
            setTotalRows(res.data.total || 0)

            // Set visible columns on first load - use schema if no data
            if (visibleColumns.length === 0) {
                if (responseData.length > 0) {
                    // Get columns from data
                    setVisibleColumns(Object.keys(responseData[0]).filter(k => k !== 'rowid'))
                } else if (schemaRes.data.schema && schemaRes.data.schema.length > 0) {
                    // Get columns from schema when table is empty
                    setVisibleColumns(schemaRes.data.schema.map(col => col.name).filter(k => k !== 'rowid'))
                }
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Error loading data')
            console.error('Fetch error:', err)
        } finally {
            setLoading(false)
        }
    }, [activeTable, page, sortConfig, debouncedSearch, visibleColumns.length])

    // Fetch data when dependencies change
    useEffect(() => {
        fetchTableData()
    }, [fetchTableData])

    // Reset state when table changes
    useEffect(() => {
        setPage(0)
        setSearchTerm('')
        setDebouncedSearch('')
        setSortConfig({ key: null, direction: 'asc' })
        setVisibleColumns([])
    }, [activeTable])

    // Add new row
    const handleAddRow = () => {
        setEditingRow(null)
        setShowRowEditor(true)
    }

    // Edit row
    const handleEditRow = (row) => {
        setEditingRow(row)
        setShowRowEditor(true)
    }

    // Delete row
    const handleDeleteRow = async (rowid) => {
        if (!confirm('Are you sure you want to delete this row?')) return

        try {
            await axios.delete(`${API_URL}/api/tables/${activeTable}/rows/${rowid}`)
            fetchTableData()
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to delete row')
        }
    }

    // Server-side sorting - just update state, useEffect will refetch
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }))
        setPage(0) // Reset to first page on sort change
    }

    const toggleColumn = (col) => {
        setVisibleColumns(prev =>
            prev.includes(col)
                ? prev.filter(c => c !== col)
                : [...prev, col]
        )
    }

    const formatValue = (value) => {
        if (value === null || value === undefined) return '-'
        if (typeof value === 'number') {
            return value.toLocaleString('tr-TR', {
                minimumFractionDigits: value % 1 !== 0 ? 2 : 0,
                maximumFractionDigits: 2
            })
        }
        return String(value)
    }

    const exportCSV = () => {
        if (data.length === 0) return

        const headers = visibleColumns.join(',')
        // Use data directly since it's already sorted by server
        const rows = data.map(row =>
            visibleColumns.map(col => `"${row[col] ?? ''}"`).join(',')
        )
        const csv = [headers, ...rows].join('\n')

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${activeTable}_export.csv`
        link.click()
    }

    // Export to Excel
    const exportExcel = () => {
        if (data.length === 0) return

        // Prepare data with visible columns only
        const exportData = data.map(row => {
            const filteredRow = {}
            visibleColumns.forEach(col => {
                filteredRow[col] = row[col] ?? ''
            })
            return filteredRow
        })

        // Create workbook and worksheet
        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, activeTable)

        // Auto-size columns
        const colWidths = visibleColumns.map(col => ({
            wch: Math.max(col.length, 15)
        }))
        ws['!cols'] = colWidths

        // Export
        XLSX.writeFile(wb, `${activeTable}_export.xlsx`)
    }

    const currentTableInfo = tables.find(t => t.name === activeTable)
    const allColumns = data.length > 0 ? Object.keys(data[0]) : []

    if (!activeTable) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <Table className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600">Select a Table</h3>
                    <p className="text-gray-400 text-sm mt-1">Select a table from the left menu</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col p-6 overflow-hidden min-w-0">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Data View</h1>
                        <p className="text-gray-500 text-sm">
                            {activeTable} - {currentTableInfo?.row_count.toLocaleString('en-US')} records
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleAddRow}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Row
                        </button>
                        <button
                            onClick={fetchTableData}
                            disabled={loading}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            onClick={exportCSV}
                            disabled={data.length === 0}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            CSV
                        </button>
                        <button
                            onClick={exportExcel}
                            disabled={data.length === 0}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4 mb-4">
                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search in table..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                        />
                        {loading && searchTerm && (
                            <RefreshCw className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin" />
                        )}
                    </div>

                    {/* Column Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowColumnSelector(!showColumnSelector)}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <Columns className="w-4 h-4" />
                            Columns ({visibleColumns.length}/{allColumns.length})
                        </button>

                        {showColumnSelector && (
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-64 overflow-y-auto">
                                <div className="p-2">
                                    <p className="text-xs text-gray-400 px-2 py-1 mb-1">Visible Columns</p>
                                    {allColumns.map(col => (
                                        <label
                                            key={col}
                                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={visibleColumns.includes(col)}
                                                onChange={() => toggleColumn(col)}
                                                className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                                            />
                                            <span className="text-sm text-gray-700">{col}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats - now showing server-side totals */}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>Total: {totalRows.toLocaleString('tr-TR')} records</span>
                    <span>Showing: {data.length} records</span>
                    <span>Page: {page + 1} / {totalPages}</span>
                    {debouncedSearch && (
                        <span className="text-blue-600">Filtered by: "{debouncedSearch}"</span>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="card p-4 mb-4 bg-gray-50 border-gray-300">
                    <p className="text-gray-600 text-sm">{error}</p>
                </div>
            )}

            {/* Table Container - Fixed height, horizontal scroll inside */}
            <div className="card flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
                {loading ? (
                    <div className="flex-1 overflow-x-scroll overflow-y-auto">
                        <table className="border-collapse" style={{ minWidth: '100%', width: 'max-content' }}>
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b whitespace-nowrap w-10">
                                        #
                                    </th>
                                    {[...Array(visibleColumns.length || 5)].map((_, idx) => (
                                        <th key={idx} className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                                            <div className="skeleton-shimmer h-4 w-24 rounded"></div>
                                        </th>
                                    ))}
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b sticky right-0 bg-gray-50 z-20 w-20">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {[...Array(10)].map((_, rowIdx) => (
                                    <tr key={rowIdx}>
                                        <td className="px-2 py-2 text-sm text-gray-400 whitespace-nowrap w-10">
                                            <div className="skeleton-shimmer h-4 w-6 rounded"></div>
                                        </td>
                                        {[...Array(visibleColumns.length || 5)].map((_, colIdx) => (
                                            <td key={colIdx} className="px-2 py-2 text-sm text-gray-700">
                                                <div className="skeleton-shimmer h-4 w-32 rounded"></div>
                                            </td>
                                        ))}
                                        <td className="px-2 py-2 text-sm sticky right-0 bg-white z-10 w-20">
                                            <div className="flex items-center gap-1">
                                                <div className="skeleton-shimmer h-6 w-6 rounded"></div>
                                                <div className="skeleton-shimmer h-6 w-6 rounded"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <>
                        {/* Table Wrapper - THIS scrolls horizontally */}
                        <div className="flex-1 overflow-x-scroll overflow-y-auto">
                            <table className="border-collapse" style={{ minWidth: '100%', width: 'max-content' }}>
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b whitespace-nowrap w-10">
                                            #
                                        </th>
                                        {visibleColumns.map(col => (
                                            <th
                                                key={col}
                                                onClick={() => handleSort(col)}
                                                className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b cursor-pointer hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-1 whitespace-nowrap">
                                                    <span className="truncate max-w-[120px]" title={col}>{col}</span>
                                                    {sortConfig.key === col && (
                                                        <span className="text-gray-600 flex-shrink-0">
                                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b sticky right-0 bg-gray-50 z-20 w-20">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.map((row, idx) => (
                                        <tr key={row.rowid || idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-2 py-2 text-sm text-gray-400 whitespace-nowrap w-10">
                                                {page * PAGE_SIZE + idx + 1}
                                            </td>
                                            {visibleColumns.map(col => (
                                                <td
                                                    key={col}
                                                    className="px-2 py-2 text-sm text-gray-700 max-w-[150px] truncate"
                                                    title={String(row[col] ?? '')}
                                                >
                                                    {formatValue(row[col])}
                                                </td>
                                            ))}
                                            <td className="px-2 py-2 text-sm sticky right-0 bg-white z-10 w-20">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleEditRow(row)}
                                                        className="p-1 hover:bg-gray-200 rounded text-gray-500"
                                                        title="Edit row"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRow(row.rowid)}
                                                        className="p-1 hover:bg-red-100 rounded text-gray-500 hover:text-red-600"
                                                        title="Delete row"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {data.length === 0 && !loading && (
                                <div className="flex-1 flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <Table className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500">
                                            {debouncedSearch ? 'No results found for your search' : 'No data found'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, totalRows)} / {totalRows.toLocaleString('tr-TR')} records
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(0)}
                                        disabled={page === 0}
                                        className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        First
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                                    </button>

                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                                        {page + 1}
                                    </span>

                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={page === totalPages - 1}
                                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-5 h-5 text-gray-600" />
                                    </button>
                                    <button
                                        onClick={() => setPage(totalPages - 1)}
                                        disabled={page === totalPages - 1}
                                        className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Last
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Row Editor Modal */}
            {showRowEditor && (
                <RowEditorModal
                    tableName={activeTable}
                    columns={tableColumns}
                    rowData={editingRow}
                    onClose={() => {
                        setShowRowEditor(false)
                        setEditingRow(null)
                    }}
                    onSave={() => {
                        fetchTableData()
                        setShowRowEditor(false)
                        setEditingRow(null)
                    }}
                />
            )}
        </div>
    )
}
