import { useState, useEffect } from 'react'
import {
    X,
    Pencil,
    Trash2,
    Eye,
    EyeOff,
    AlertTriangle,
    RefreshCw,
    Database,
    Table2,
    Columns
} from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function TableEditorModal({ tableName, onClose, onUpdate }) {
    const [activeTab, setActiveTab] = useState('schema')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)

    // Schema state
    const [columns, setColumns] = useState([])
    const [editingColumn, setEditingColumn] = useState(null)
    const [newColumnName, setNewColumnName] = useState('')

    // Operations state
    const [newTableName, setNewTableName] = useState(tableName)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showTruncateConfirm, setShowTruncateConfirm] = useState(false)

    // Load table metadata on mount
    useEffect(() => {
        loadMetadata()
    }, [tableName])

    const loadMetadata = async () => {
        setLoading(true)
        setError(null)

        try {
            // Get table info from main endpoint
            const response = await axios.get(`${API_URL}/api/tables/${tableName}`)
            const schema = response.data.schema

            setColumns(schema.map(col => ({
                name: col.name,
                type: col.type,
                nullable: !col.notnull,
                is_primary_key: col.pk === 1 || col.is_primary_key,
                is_visible: true
            })))
        } catch (err) {
            setError('Failed to load table metadata')
        } finally {
            setLoading(false)
        }
    }

    // Rename column
    const handleRenameColumn = async (oldName) => {
        if (!newColumnName || newColumnName === oldName) {
            setEditingColumn(null)
            return
        }

        setLoading(true)
        setError(null)

        try {
            await axios.put(`${API_URL}/api/tables/${tableName}/columns/${oldName}`, {
                new_name: newColumnName
            })

            setSuccess(`Column renamed to '${newColumnName}'`)
            setEditingColumn(null)
            setNewColumnName('')
            loadMetadata()

            setTimeout(() => setSuccess(null), 2000)
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to rename column')
        } finally {
            setLoading(false)
        }
    }

    // Toggle column visibility
    const handleToggleVisibility = async (columnName, currentVisibility) => {
        try {
            await axios.patch(`${API_URL}/api/tables/${tableName}/columns/${columnName}/visibility`, {
                is_visible: !currentVisibility
            })

            setColumns(prev => prev.map(col =>
                col.name === columnName ? { ...col, is_visible: !col.is_visible } : col
            ))
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to toggle visibility')
        }
    }

    // Rename table
    const handleRenameTable = async () => {
        if (!newTableName || newTableName === tableName) return

        setLoading(true)
        setError(null)

        try {
            await axios.put(`${API_URL}/api/tables/${tableName}`, {
                new_name: newTableName
            })

            setSuccess(`Table renamed to '${newTableName}'`)

            setTimeout(() => {
                if (onUpdate) onUpdate()
                onClose()
            }, 1500)
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to rename table')
        } finally {
            setLoading(false)
        }
    }

    // Truncate table
    const handleTruncate = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await axios.post(`${API_URL}/api/tables/${tableName}/truncate`)
            setSuccess(`Deleted ${response.data.rows_deleted} rows`)
            setShowTruncateConfirm(false)

            if (onUpdate) onUpdate()
            setTimeout(() => setSuccess(null), 2000)
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to truncate table')
        } finally {
            setLoading(false)
        }
    }

    // Delete table
    const handleDelete = async () => {
        setLoading(true)
        setError(null)

        try {
            await axios.delete(`${API_URL}/api/tables/${tableName}`)
            setSuccess('Table deleted successfully')

            setTimeout(() => {
                if (onUpdate) onUpdate()
                onClose()
            }, 1500)
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete table')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Database className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-800">Edit Table</h2>
                            <p className="text-sm text-gray-500">{tableName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-600 text-sm">{success}</p>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-4">
                    <button
                        onClick={() => setActiveTab('schema')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'schema'
                            ? 'border-gray-800 text-gray-800'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Columns className="w-4 h-4" />
                            Schema
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('operations')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'operations'
                            ? 'border-gray-800 text-gray-800'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Table2 className="w-4 h-4" />
                            Operations
                        </div>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                    {activeTab === 'schema' ? (
                        <div className="space-y-2">
                            {columns.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                                    Loading columns...
                                </div>
                            ) : (
                                columns.map((col) => (
                                    <div
                                        key={col.name}
                                        className={`flex items-center gap-3 p-3 rounded-lg border ${col.is_visible ? 'border-gray-100 bg-gray-50' : 'border-gray-200 bg-gray-100 opacity-60'
                                            }`}
                                    >
                                        {/* Column Info */}
                                        <div className="flex-1">
                                            {editingColumn === col.name ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={newColumnName}
                                                        onChange={(e) => setNewColumnName(e.target.value.toLowerCase().replace(/\s/g, '_'))}
                                                        placeholder={col.name}
                                                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleRenameColumn(col.name)
                                                            if (e.key === 'Escape') setEditingColumn(null)
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => handleRenameColumn(col.name)}
                                                        className="text-green-600 text-xs"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingColumn(null)}
                                                        className="text-gray-500 text-xs"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-800">{col.name}</span>
                                                    {col.is_primary_key && (
                                                        <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">PK</span>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                <span>{col.type}</span>
                                                <span>•</span>
                                                <span>{col.nullable ? 'Nullable' : 'NOT NULL'}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            {!col.is_primary_key && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setEditingColumn(col.name)
                                                            setNewColumnName(col.name)
                                                        }}
                                                        className="p-1.5 hover:bg-gray-200 rounded"
                                                        title="Rename"
                                                    >
                                                        <Pencil className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleVisibility(col.name, col.is_visible)}
                                                        className="p-1.5 hover:bg-gray-200 rounded"
                                                        title={col.is_visible ? 'Hide column' : 'Show column'}
                                                    >
                                                        {col.is_visible ? (
                                                            <Eye className="w-4 h-4 text-gray-500" />
                                                        ) : (
                                                            <EyeOff className="w-4 h-4 text-gray-400" />
                                                        )}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Rename Table */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rename Table
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newTableName}
                                        onChange={(e) => setNewTableName(e.target.value.toLowerCase().replace(/\s/g, '_'))}
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                    />
                                    <button
                                        onClick={handleRenameTable}
                                        disabled={loading || newTableName === tableName}
                                        className="btn-primary"
                                    >
                                        Rename
                                    </button>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                                <h3 className="font-medium text-red-800 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Danger Zone
                                </h3>

                                <div className="space-y-3">
                                    {/* Truncate */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">Truncate Table</p>
                                            <p className="text-xs text-gray-500">Delete all rows, keep schema</p>
                                        </div>
                                        {showTruncateConfirm ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleTruncate}
                                                    disabled={loading}
                                                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={() => setShowTruncateConfirm(false)}
                                                    className="px-3 py-1 border border-gray-300 text-sm rounded hover:bg-gray-100"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShowTruncateConfirm(true)}
                                                className="px-3 py-1 border border-red-300 text-red-600 text-sm rounded hover:bg-red-100"
                                            >
                                                Truncate
                                            </button>
                                        )}
                                    </div>

                                    {/* Delete */}
                                    <div className="flex items-center justify-between pt-3 border-t border-red-200">
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">Delete Table</p>
                                            <p className="text-xs text-gray-500">Permanently remove table and all data</p>
                                        </div>
                                        {showDeleteConfirm ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleDelete}
                                                    disabled={loading}
                                                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteConfirm(false)}
                                                    className="px-3 py-1 border border-gray-300 text-sm rounded hover:bg-gray-100"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShowDeleteConfirm(true)}
                                                disabled={tableName === 'sales'}
                                                className="px-3 py-1 border border-red-300 text-red-600 text-sm rounded hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
                    <button onClick={onClose} className="btn-secondary">
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
