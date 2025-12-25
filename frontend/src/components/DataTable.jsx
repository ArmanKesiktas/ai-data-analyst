import { Table, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export default function DataTable({ data }) {
    const [page, setPage] = useState(0)
    const pageSize = 10
    const totalPages = Math.ceil(data.length / pageSize)

    if (!data || data.length === 0) {
        return null
    }

    const columns = Object.keys(data[0])
    const paginatedData = data.slice(page * pageSize, (page + 1) * pageSize)

    const formatValue = (value) => {
        if (typeof value === 'number') {
            return value.toLocaleString('tr-TR', {
                minimumFractionDigits: value % 1 !== 0 ? 2 : 0,
                maximumFractionDigits: 2
            })
        }
        return value
    }

    return (
        <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Table className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">Data Table</h3>
                    <span className="text-sm text-gray-400 ml-2">({data.length} records)</span>
                </div>
                <button className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    <span>Export</span>
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col}>{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row, idx) => (
                            <tr key={idx} className="group">
                                {columns.map((col) => (
                                    <td key={col}>
                                        {formatValue(row[col])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        {page * pageSize + 1} - {Math.min((page + 1) * pageSize, data.length)} / {data.length} records shown
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="text-sm text-gray-600 min-w-[80px] text-center">
                            Page {page + 1} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page === totalPages - 1}
                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
