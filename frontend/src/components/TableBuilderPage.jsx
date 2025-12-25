import { useState, useEffect } from 'react'
import {
    Plus,
    Trash2,
    GripVertical,
    Eye,
    Code,
    AlertCircle,
    CheckCircle,
    ArrowLeft,
    Table2
} from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Data type options for columns
const DATA_TYPES = [
    { value: 'text', label: 'Text', description: 'Variable-length text' },
    { value: 'number', label: 'Number', description: 'Decimal numbers' },
    { value: 'date', label: 'Date', description: 'Date values' },
    { value: 'boolean', label: 'Boolean', description: 'True/False values' }
]

// Validate column name (snake_case only)
const isValidColumnName = (name) => {
    return /^[a-z][a-z0-9_]*$/.test(name)
}

export default function TableBuilderPage({ onBack, onTableCreated }) {
    const [tableName, setTableName] = useState('')
    const [columns, setColumns] = useState([
        { id: 1, name: '', type: 'text', nullable: true, is_primary_key: false }
    ])
    const [addAutoId, setAddAutoId] = useState(true)
    const [sqlPreview, setSqlPreview] = useState('')
    const [showPreview, setShowPreview] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [validationErrors, setValidationErrors] = useState({})

    // Generate next column ID
    const getNextId = () => Math.max(...columns.map(c => c.id), 0) + 1

    // Add new column
    const addColumn = () => {
        setColumns([
            ...columns,
            { id: getNextId(), name: '', type: 'text', nullable: true, is_primary_key: false }
        ])
    }

    // Remove column
    const removeColumn = (id) => {
        if (columns.length === 1) return
        setColumns(columns.filter(c => c.id !== id))
    }

    // Update column property
    const updateColumn = (id, field, value) => {
        setColumns(columns.map(col => {
            if (col.id !== id) return col

            // If setting primary key, unset others
            if (field === 'is_primary_key' && value) {
                // When PK is set, nullable should be false
                return { ...col, [field]: value, nullable: false }
            }

            return { ...col, [field]: value }
        }))

        // If setting primary key, clear other PKs
        if (field === 'is_primary_key' && value) {
            setColumns(prev => prev.map(col => ({
                ...col,
                is_primary_key: col.id === id
            })))
        }

        // Clear validation error for this field
        setValidationErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors[`${id}-${field}`]
            return newErrors
        })
    }

    // Validate all inputs
    const validate = () => {
        const errors = {}

        // Validate table name
        if (!tableName) {
            errors.tableName = 'Table name is required'
        } else if (!isValidColumnName(tableName)) {
            errors.tableName = 'Must be snake_case (lowercase, underscores only)'
        }

        // Validate columns
        const names = new Set()
        columns.forEach((col, idx) => {
            if (!col.name) {
                errors[`${col.id}-name`] = 'Required'
            } else if (!isValidColumnName(col.name)) {
                errors[`${col.id}-name`] = 'Must be snake_case'
            } else if (names.has(col.name.toLowerCase())) {
                errors[`${col.id}-name`] = 'Duplicate name'
            } else {
                names.add(col.name.toLowerCase())
            }
        })

        setValidationErrors(errors)
        return Object.keys(errors).length === 0
    }

    // Fetch SQL preview
    const fetchPreview = async () => {
        if (!validate()) return

        setLoading(true)
        setError(null)

        try {
            const response = await axios.post(`${API_URL}/api/tables/create/preview`, {
                name: tableName,
                columns: columns.map(c => ({
                    name: c.name,
                    type: c.type,
                    nullable: c.nullable,
                    is_primary_key: c.is_primary_key
                })),
                add_auto_id: addAutoId
            })

            setSqlPreview(response.data.sql)
            setShowPreview(true)
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to generate preview')
        } finally {
            setLoading(false)
        }
    }

    // Create table
    const createTable = async () => {
        if (!validate()) return

        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const response = await axios.post(`${API_URL}/api/tables/create`, {
                name: tableName,
                columns: columns.map(c => ({
                    name: c.name,
                    type: c.type,
                    nullable: c.nullable,
                    is_primary_key: c.is_primary_key
                })),
                add_auto_id: addAutoId
            })

            setSuccess(`Table '${tableName}' created successfully!`)

            // Notify parent and go back after delay
            setTimeout(() => {
                if (onTableCreated) onTableCreated(tableName)
                if (onBack) onBack()
            }, 1500)
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create table')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex-1 flex flex-col p-6 overflow-auto">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Table2 className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Create New Table</h1>
                        <p className="text-gray-500 text-sm">Define your table schema with columns and types</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="card p-4 mb-4 bg-red-50 border-red-200">
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {success && (
                <div className="card p-4 mb-4 bg-green-50 border-green-200">
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span>{success}</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                {/* Column Editor */}
                <div className="card p-6">
                    <h2 className="font-semibold text-gray-800 mb-4">Table Configuration</h2>

                    {/* Table Name */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Table Name
                        </label>
                        <input
                            type="text"
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value.toLowerCase().replace(/\s/g, '_'))}
                            placeholder="my_table_name"
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 ${validationErrors.tableName ? 'border-red-300' : 'border-gray-200'
                                }`}
                        />
                        {validationErrors.tableName && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors.tableName}</p>
                        )}
                    </div>

                    {/* Auto ID Option */}
                    <div className="mb-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={addAutoId}
                                onChange={(e) => setAddAutoId(e.target.checked)}
                                className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                            />
                            <span className="text-sm text-gray-700">
                                Auto-add ID column (recommended)
                            </span>
                        </label>
                        <p className="text-xs text-gray-400 mt-1 ml-6">
                            Adds an auto-incrementing primary key if no PK is defined
                        </p>
                    </div>

                    {/* Column List */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Columns
                            </label>
                            <button
                                onClick={addColumn}
                                className="btn-secondary text-xs py-1 px-2 flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" />
                                Add Column
                            </button>
                        </div>

                        <div className="space-y-3">
                            {columns.map((col, idx) => (
                                <div
                                    key={col.id}
                                    className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg"
                                >
                                    <GripVertical className="w-4 h-4 text-gray-300 mt-2 cursor-grab" />

                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                        {/* Column Name */}
                                        <div>
                                            <input
                                                type="text"
                                                value={col.name}
                                                onChange={(e) => updateColumn(col.id, 'name', e.target.value.toLowerCase().replace(/\s/g, '_'))}
                                                placeholder="column_name"
                                                className={`w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 ${validationErrors[`${col.id}-name`] ? 'border-red-300' : 'border-gray-200'
                                                    }`}
                                            />
                                            {validationErrors[`${col.id}-name`] && (
                                                <p className="text-red-500 text-xs mt-0.5">{validationErrors[`${col.id}-name`]}</p>
                                            )}
                                        </div>

                                        {/* Data Type */}
                                        <select
                                            value={col.type}
                                            onChange={(e) => updateColumn(col.id, 'type', e.target.value)}
                                            className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
                                        >
                                            {DATA_TYPES.map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>

                                        {/* Options Row */}
                                        <div className="col-span-2 flex items-center gap-4 mt-1">
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={col.nullable}
                                                    onChange={(e) => updateColumn(col.id, 'nullable', e.target.checked)}
                                                    disabled={col.is_primary_key}
                                                    className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                                                />
                                                <span className="text-xs text-gray-600">Nullable</span>
                                            </label>

                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={col.is_primary_key}
                                                    onChange={(e) => updateColumn(col.id, 'is_primary_key', e.target.checked)}
                                                    className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                                                />
                                                <span className="text-xs text-gray-600">Primary Key</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeColumn(col.id)}
                                        disabled={columns.length === 1}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* SQL Preview */}
                <div className="card p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-gray-800">SQL Preview</h2>
                        <button
                            onClick={fetchPreview}
                            disabled={loading}
                            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                        >
                            <Eye className="w-3 h-3" />
                            Generate Preview
                        </button>
                    </div>

                    <div className="flex-1 bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-auto">
                        {sqlPreview ? (
                            <pre className="text-green-400 whitespace-pre-wrap">{sqlPreview}</pre>
                        ) : (
                            <div className="text-gray-500 flex items-center justify-center h-full">
                                <div className="text-center">
                                    <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>Click "Generate Preview" to see the SQL</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                        <button
                            onClick={onBack}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={createTable}
                            disabled={loading || !tableName || columns.some(c => !c.name)}
                            className="btn-primary"
                        >
                            {loading ? 'Creating...' : 'Create Table'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
