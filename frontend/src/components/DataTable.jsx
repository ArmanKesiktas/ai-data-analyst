import { Table, Download, ChevronLeft, ChevronRight, Search, ArrowUpDown } from 'lucide-react'
import { useState, useMemo } from 'react'

export default function DataTable({ data }) {
    const [page, setPage] = useState(0)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
    const pageSize = 10

    if (!data || data.length === 0) {
        return null
    }

    const columns = Object.keys(data[0])

    // Filter data based on search
    const filteredData = useMemo(() => {
        if (!searchTerm) return data
        return data.filter(row =>
            columns.some(col =>
                String(row[col]).toLowerCase().includes(searchTerm.toLowerCase())
            )
        )
    }, [data, searchTerm, columns])

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData
        return [...filteredData].sort((a, b) => {
            const aVal = a[sortConfig.key]
            const bVal = b[sortConfig.key]
            if (aVal === bVal) return 0
            if (aVal === null || aVal === undefined) return 1
            if (bVal === null || bVal === undefined) return -1
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
            }
            return sortConfig.direction === 'asc'
                ? String(aVal).localeCompare(String(bVal))
                : String(bVal).localeCompare(String(aVal))
        })
    }, [filteredData, sortConfig])

    const totalPages = Math.ceil(sortedData.length / pageSize)
    const paginatedData = sortedData.slice(page * pageSize, (page + 1) * pageSize)

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }))
    }

    const formatValue = (value, colName) => {
        if (value === null || value === undefined) {
            return <span className="text-gray-300">—</span>
        }
        if (typeof value === 'number') {
            return (
                <span className="font-mono text-right block">
                    {value.toLocaleString('en-US', {
                        minimumFractionDigits: value % 1 !== 0 ? 2 : 0,
                        maximumFractionDigits: 2
                    })}
                </span>
            )
        }
        // Truncate long text
        if (typeof value === 'string' && value.length > 50) {
            return (
                <span title={value} className="cursor-help">
                    {value.substring(0, 47)}...
                </span>
            )
        }
        return value
    }

    const getColumnStyle = (value) => {
        if (typeof value === 'number') return 'text-right'
        return 'text-left'
    }

    return (
        <div className="card overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Table className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">Data Table</h3>
                        <p className="text-xs text-gray-400">
                            {sortedData.length} {sortedData.length === 1 ? 'record' : 'records'}
                            {searchTerm && ` (filtered from ${data.length})`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(0) }}
                            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none w-48"
                        />
                    </div>
                    <button className="btn-secondary py-2 px-4 text-sm flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            {columns.map((col) => (
                                <th
                                    key={col}
                                    onClick={() => handleSort(col)}
                                    className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${getColumnStyle(paginatedData[0]?.[col])}`}
                                >
                                    <div className="flex items-center gap-1 justify-between">
                                        <span className="truncate">{col.replace(/_/g, ' ')}</span>
                                        <ArrowUpDown className={`w-3 h-3 flex-shrink-0 ${sortConfig.key === col ? 'text-blue-500' : 'text-gray-300'}`} />
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {paginatedData.map((row, idx) => (
                            <tr
                                key={idx}
                                className="hover:bg-blue-50/30 transition-colors group"
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col}
                                        className={`px-4 py-3 text-sm text-gray-700 ${getColumnStyle(row[col])}`}
                                    >
                                        {formatValue(row[col], col)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Empty state for filtered results */}
            {paginatedData.length === 0 && searchTerm && (
                <div className="px-6 py-12 text-center">
                    <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No results found for "{searchTerm}"</p>
                    <button
                        onClick={() => setSearchTerm('')}
                        className="mt-2 text-sm text-blue-500 hover:text-blue-600"
                    >
                        Clear search
                    </button>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <p className="text-sm text-gray-500">
                        Showing <span className="font-medium text-gray-700">{page * pageSize + 1}</span> to{' '}
                        <span className="font-medium text-gray-700">{Math.min((page + 1) * pageSize, sortedData.length)}</span> of{' '}
                        <span className="font-medium text-gray-700">{sortedData.length}</span> records
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(0)}
                            disabled={page === 0}
                            className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            First
                        </button>
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>

                        {/* Page numbers */}
                        <div className="flex items-center gap-1 px-2">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum
                                if (totalPages <= 5) {
                                    pageNum = i
                                } else if (page < 3) {
                                    pageNum = i
                                } else if (page > totalPages - 4) {
                                    pageNum = totalPages - 5 + i
                                } else {
                                    pageNum = page - 2 + i
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-8 h-8 text-sm rounded-lg transition-colors ${pageNum === page
                                            ? 'bg-blue-500 text-white font-medium'
                                            : 'hover:bg-gray-200 text-gray-600'
                                            }`}
                                    >
                                        {pageNum + 1}
                                    </button>
                                )
                            })}
                        </div>

                        <button
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page === totalPages - 1}
                            className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                            onClick={() => setPage(totalPages - 1)}
                            disabled={page === totalPages - 1}
                            className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Last
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
