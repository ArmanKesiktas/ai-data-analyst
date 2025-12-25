import { useState, useEffect } from 'react'
import { X, Save, Plus, Trash2 } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function RowEditorModal({
    tableName,
    columns,
    rowData = null, // null for new row, object for edit
    onClose,
    onSave
}) {
    const [formData, setFormData] = useState({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (rowData) {
            // Edit mode - populate with existing data
            setFormData({ ...rowData })
        } else {
            // New row - initialize empty
            const initialData = {}
            columns.forEach(col => {
                if (col.name !== 'rowid' && col.name !== 'id') {
                    initialData[col.name] = ''
                }
            })
            setFormData(initialData)
        }
    }, [rowData, columns])

    const handleChange = (colName, value) => {
        setFormData(prev => ({
            ...prev,
            [colName]: value
        }))
    }

    // Format error messages to be user-friendly
    const formatError = (errorMsg) => {
        if (!errorMsg) return 'An error occurred'

        // UNIQUE constraint violation
        if (errorMsg.includes('UNIQUE constraint failed')) {
            const match = errorMsg.match(/UNIQUE constraint failed: (\w+)\.(\w+)/)
            if (match) {
                return `This value already exists. The "${match[2]}" field must be unique.`
            }
            return 'This value already exists. Please use a unique value.'
        }

        // NOT NULL constraint
        if (errorMsg.includes('NOT NULL constraint failed')) {
            const match = errorMsg.match(/NOT NULL constraint failed: (\w+)\.(\w+)/)
            if (match) {
                return `The "${match[2]}" field is required.`
            }
            return 'Please fill in all required fields.'
        }

        // IntegrityError
        if (errorMsg.includes('IntegrityError')) {
            return 'Data integrity error. Please check your input values.'
        }

        // Type errors
        if (errorMsg.includes('invalid literal') || errorMsg.includes('could not convert')) {
            return 'Invalid data type. Please check numeric fields.'
        }

        // Connection errors
        if (errorMsg.includes('Connection') || errorMsg.includes('Network')) {
            return 'Connection error. Please try again.'
        }

        // For other errors, show a simplified version
        if (errorMsg.length > 100) {
            return 'An error occurred while saving. Please check your data.'
        }

        return errorMsg
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError(null)

        try {
            // Remove empty strings, rowid, and id (primary key columns should not be updated)
            const dataToSend = {}
            Object.entries(formData).forEach(([key, value]) => {
                if (key !== 'rowid' && key !== 'id' && value !== '') {
                    dataToSend[key] = value
                }
            })

            if (rowData && rowData.rowid) {
                // Update existing row
                await axios.put(`${API_URL}/api/tables/${tableName}/rows/${rowData.rowid}`, dataToSend)
            } else {
                // Insert new row
                await axios.post(`${API_URL}/api/tables/${tableName}/rows`, dataToSend)
            }

            if (onSave) onSave()
            onClose()
        } catch (err) {
            const rawError = err.response?.data?.detail || 'Operation failed'
            setError(formatError(rawError))
        } finally {
            setLoading(false)
        }
    }

    const isEditMode = !!rowData

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            {isEditMode ? <Save className="w-5 h-5 text-gray-600" /> : <Plus className="w-5 h-5 text-gray-600" />}
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-800">
                                {isEditMode ? 'Edit Row' : 'Add New Row'}
                            </h2>
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

                {/* Error */}
                {error && (
                    <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {/* Form */}
                <div className="flex-1 overflow-auto p-4">
                    <div className="space-y-4">
                        {columns
                            .filter(col => col.name !== 'rowid' && col.name !== 'id')
                            .map(col => (
                                <div key={col.name}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {col.name}
                                        {!col.nullable && <span className="text-red-500 ml-1">*</span>}
                                        <span className="text-xs text-gray-400 ml-2">({col.type})</span>
                                    </label>
                                    <input
                                        type={col.type === 'INTEGER' || col.type === 'REAL' ? 'number' : 'text'}
                                        value={formData[col.name] ?? ''}
                                        onChange={(e) => handleChange(col.name, e.target.value)}
                                        placeholder={`Enter ${col.name}`}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                    />
                                </div>
                            ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
                    <button onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add Row')}
                    </button>
                </div>
            </div>
        </div>
    )
}
