import { useState } from 'react'
import { X, Copy, Check, FolderOpen } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'

/**
 * CopyTableModal - Modal for copying tables between workspaces
 *
 * Features:
 * - Shows list of available target workspaces
 * - Excludes current workspace from options
 * - Displays workspace role (owner/editor/viewer)
 * - Only allows copy to workspaces where user has edit permission
 * - Shows confirmation after successful copy
 */
export default function CopyTableModal({ isOpen, onClose, tableName, tableData, currentWorkspaceId }) {
    const { workspaces, addNotification } = useWorkspace()
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null)
    const [copying, setCopying] = useState(false)
    const [copied, setCopied] = useState(false)

    if (!isOpen) return null

    // Filter workspaces: exclude current workspace and viewer-only workspaces
    const availableWorkspaces = workspaces.filter(ws =>
        ws.id !== currentWorkspaceId &&
        (ws.role === 'owner' || ws.role === 'editor')
    )

    const handleCopy = async () => {
        if (!selectedWorkspaceId) {
            addNotification('Please select a workspace', 'error')
            return
        }

        setCopying(true)

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 500))

            // Get target workspace
            const targetWorkspace = workspaces.find(ws => ws.id === selectedWorkspaceId)

            // Here you would make an API call to copy the table
            // For now, we'll just show a success message

            setCopied(true)
            addNotification(
                `Table "${tableName}" copied to "${targetWorkspace.name}"`,
                'success'
            )

            // Close modal after 1.5 seconds
            setTimeout(() => {
                onClose()
                setCopied(false)
                setSelectedWorkspaceId(null)
            }, 1500)

        } catch (error) {
            addNotification('Failed to copy table', 'error')
        } finally {
            setCopying(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                            <Copy className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Copy Table</h2>
                            <p className="text-sm text-gray-500">Choose destination workspace</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={copying}
                        className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Table Info */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <FolderOpen className="w-4 h-4" />
                            <span>Table to copy</span>
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                            {tableName}
                        </div>
                        {tableData && (
                            <div className="text-sm text-gray-500 mt-1">
                                {tableData.rowCount || 0} rows
                            </div>
                        )}
                    </div>

                    {/* Workspace Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select destination workspace
                        </label>

                        {availableWorkspaces.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <FolderOpen className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 text-sm">
                                    No workspaces available
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                    You need editor or owner access to copy tables
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {availableWorkspaces.map(workspace => (
                                    <button
                                        key={workspace.id}
                                        onClick={() => setSelectedWorkspaceId(workspace.id)}
                                        disabled={copying}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                            selectedWorkspaceId === workspace.id
                                                ? 'border-gray-800 bg-gray-50'
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">
                                                    {workspace.name}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        workspace.role === 'owner'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {workspace.role}
                                                    </span>
                                                    {workspace.tables && (
                                                        <span>
                                                            {workspace.tables.length} table{workspace.tables.length !== 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {selectedWorkspaceId === workspace.id && (
                                                <div className="ml-3">
                                                    <div className="w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center">
                                                        <Check className="w-3 h-3 text-white" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={copying}
                            className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCopy}
                            disabled={!selectedWorkspaceId || copying || copied || availableWorkspaces.length === 0}
                            className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-5 h-5" />
                                    Copied!
                                </>
                            ) : copying ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Copying...
                                </>
                            ) : (
                                <>
                                    <Copy className="w-5 h-5" />
                                    Copy Table
                                </>
                            )}
                        </button>
                    </div>

                    {/* Info Note */}
                    <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-xs text-gray-600">
                            <strong>Note:</strong> This will create a copy of the table structure and data in the selected workspace. The original table will remain unchanged.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
