import { useState } from 'react'
import { X, FolderPlus } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'

export default function CreateWorkspaceModal({ onClose }) {
    const { createWorkspace } = useWorkspace()
    const [name, setName] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()

        if (!name.trim()) {
            setError('Workspace name is required')
            return
        }

        if (name.trim().length < 3) {
            setError('Workspace name must be at least 3 characters')
            return
        }

        createWorkspace(name.trim())
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <FolderPlus className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-800">Create Workspace</h2>
                            <p className="text-sm text-gray-500">Create a new workspace for your data</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Workspace Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value)
                                setError('')
                            }}
                            placeholder="e.g., Sales Analytics, Marketing Data"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                            autoFocus
                        />
                        {error && (
                            <p className="text-red-500 text-sm mt-1">{error}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                        >
                            Create Workspace
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
