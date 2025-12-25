import { useState } from 'react'
import { X, Settings, Trash2, Users, Database, Download, Upload, AlertTriangle, Check } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'

/**
 * GeneralSettingsModal - Workspace general settings
 *
 * Features:
 * - Workspace settings (rename, delete)
 * - Member management
 * - Data export/import
 * - Danger zone
 */
export default function GeneralSettingsModal({ onClose }) {
    const {
        currentWorkspace,
        workspaces,
        renameWorkspace,
        deleteWorkspace,
        addNotification
    } = useWorkspace()

    const [activeTab, setActiveTab] = useState('general')
    const [workspaceName, setWorkspaceName] = useState(currentWorkspace.name)
    const [deleteConfirm, setDeleteConfirm] = useState('')
    const [saved, setSaved] = useState(false)

    const tabs = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'members', label: 'Members', icon: Users },
        { id: 'data', label: 'Data', icon: Database },
        { id: 'danger', label: 'Danger Zone', icon: AlertTriangle }
    ]

    const handleRenameWorkspace = (e) => {
        e.preventDefault()
        if (workspaceName && workspaceName !== currentWorkspace.name) {
            renameWorkspace(currentWorkspace.id, workspaceName)
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        }
    }

    const handleDeleteWorkspace = () => {
        if (deleteConfirm === currentWorkspace.name) {
            if (deleteWorkspace(currentWorkspace.id)) {
                onClose()
            }
        } else {
            addNotification('Workspace name does not match', 'error')
        }
    }

    const handleExportData = () => {
        const data = {
            workspace: currentWorkspace,
            tables: currentWorkspace.tables || [],
            exportedAt: new Date().toISOString()
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${currentWorkspace.name.replace(/\s+/g, '_')}_export_${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
        addNotification('Workspace data exported successfully', 'success')
    }

    const members = currentWorkspace.members || []

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Settings className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Workspace Settings</h2>
                            <p className="text-sm text-gray-300">{currentWorkspace.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 px-6">
                    <div className="flex gap-1">
                        {tabs.map(tab => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-gray-800 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="font-medium">{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <form onSubmit={handleRenameWorkspace}>
                                <div className="p-6 border-2 border-gray-200 rounded-xl">
                                    <h3 className="font-semibold text-gray-900 mb-4">Workspace Name</h3>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={workspaceName}
                                            onChange={(e) => setWorkspaceName(e.target.value)}
                                            className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-gray-800 focus:ring-2 focus:ring-gray-100 transition-all outline-none"
                                            placeholder="Workspace name"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!workspaceName || workspaceName === currentWorkspace.name}
                                            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {saved ? 'Saved!' : 'Rename'}
                                        </button>
                                    </div>
                                </div>
                            </form>

                            <div className="p-6 border-2 border-gray-200 rounded-xl">
                                <h3 className="font-semibold text-gray-900 mb-4">Workspace Information</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Workspace ID</span>
                                        <span className="font-medium text-gray-900">{currentWorkspace.id}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Created</span>
                                        <span className="font-medium text-gray-900">
                                            {new Date(currentWorkspace.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Role</span>
                                        <span className="font-medium text-gray-900 capitalize">{currentWorkspace.role}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Tables</span>
                                        <span className="font-medium text-gray-900">{currentWorkspace.tables?.length || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Members</span>
                                        <span className="font-medium text-gray-900">{members.length + 1}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Members Tab */}
                    {activeTab === 'members' && (
                        <div className="space-y-4">
                            {/* Owner */}
                            <div className="p-4 border-2 border-gray-200 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                            <Users className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">You (Owner)</div>
                                            <div className="text-sm text-gray-500">Full access to workspace</div>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                        Owner
                                    </span>
                                </div>
                            </div>

                            {/* Members */}
                            {members.length > 0 ? (
                                members.map((member, index) => (
                                    <div key={index} className="p-4 border-2 border-gray-200 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{member.email}</div>
                                                    <div className="text-sm text-gray-500">
                                                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                                    member.role === 'editor'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {member.role}
                                                </span>
                                                {currentWorkspace.role === 'owner' && (
                                                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Users className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500">No members yet</p>
                                    <p className="text-sm text-gray-400 mt-1">Invite team members to collaborate</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Data Tab */}
                    {activeTab === 'data' && (
                        <div className="space-y-6">
                            <div className="p-6 border-2 border-gray-200 rounded-xl">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Download className="w-5 h-5" />
                                            Export Workspace Data
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Download all workspace data as JSON
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleExportData}
                                    className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Export Data
                                </button>
                            </div>

                            <div className="p-6 border-2 border-gray-200 rounded-xl">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Upload className="w-5 h-5" />
                                            Import Workspace Data
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Import data from a JSON file
                                        </p>
                                    </div>
                                </div>
                                <label className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors inline-flex items-center gap-2 cursor-pointer">
                                    <Upload className="w-4 h-4" />
                                    Choose File
                                    <input type="file" accept=".json" className="hidden" />
                                </label>
                            </div>

                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <p className="text-sm text-blue-700">
                                    <strong>Note:</strong> Exported data includes workspace settings, tables, and metadata.
                                    Actual table data is stored separately and needs to be exported individually.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Danger Zone Tab */}
                    {activeTab === 'danger' && (
                        <div className="space-y-6">
                            <div className="p-6 border-2 border-red-200 bg-red-50 rounded-xl">
                                <div className="flex items-start gap-3 mb-4">
                                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-red-900">Delete Workspace</h3>
                                        <p className="text-sm text-red-700 mt-1">
                                            Once you delete a workspace, there is no going back. This will permanently delete all tables,
                                            dashboards, and data associated with this workspace.
                                        </p>
                                    </div>
                                </div>

                                {workspaces.length <= 1 ? (
                                    <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                                        <p className="text-sm text-red-700">
                                            You cannot delete your last workspace. Create another workspace before deleting this one.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-red-900 mb-2">
                                                Type <span className="font-mono font-bold">{currentWorkspace.name}</span> to confirm
                                            </label>
                                            <input
                                                type="text"
                                                value={deleteConfirm}
                                                onChange={(e) => setDeleteConfirm(e.target.value)}
                                                className="w-full px-4 py-2.5 border-2 border-red-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all outline-none"
                                                placeholder={currentWorkspace.name}
                                            />
                                        </div>
                                        <button
                                            onClick={handleDeleteWorkspace}
                                            disabled={deleteConfirm !== currentWorkspace.name}
                                            className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete Workspace Permanently
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
