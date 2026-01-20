import { useState, useEffect } from 'react'
import axios from 'axios'
import { X, Mail, UserPlus, Check, Copy as CopyIcon, Users, Shield, Eye } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function InviteToWorkspaceModal({ isOpen, onClose }) {
    const { currentWorkspace, inviteToWorkspace } = useWorkspace()
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('viewer')
    const [inviting, setInviting] = useState(false)
    const [invited, setInvited] = useState(false)
    const [shareLink, setShareLink] = useState('')
    const [linkCopied, setLinkCopied] = useState(false)

    // Outgoing invitations for this workspace
    const [outgoingInvitations, setOutgoingInvitations] = useState([])

    useEffect(() => {
        if (isOpen && currentWorkspace) {
            fetchOutgoingInvitations()
        }
    }, [isOpen, currentWorkspace])

    const fetchOutgoingInvitations = async () => {
        try {
            // Check if we have auth token
            const token = localStorage.getItem('token') || localStorage.getItem('access_token')
            if (!token) return

            const response = await axios.get(
                `${API_URL}/api/workspaces/${currentWorkspace.id}/invitations`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setOutgoingInvitations(response.data)
        } catch (error) {
            console.error('Failed to fetch outgoing invitations:', error)
        }
    }

    if (!isOpen) return null

    const handleInvite = async (e) => {
        e.preventDefault()

        if (!email) return

        setInviting(true)

        try {
            // Call API via Context
            const result = await inviteToWorkspace(currentWorkspace.id, email, role)

            if (result) {
                // Use REAL token from backend
                const inviteToken = result.token
                const link = `${window.location.origin}/join/${inviteToken}` // This route needs to exist in frontend

                // Or if no /join route, maybe just show the token?
                // The plan mentioned adding "accept" button in UI, so usually no need for external link unless sharing via chat.
                // Assuming share link is still desired.

                setShareLink(link)
                setInvited(true)
                setEmail('')

                // Refresh list
                fetchOutgoingInvitations()

                setTimeout(() => {
                    setInvited(false)
                }, 3000)
            }

        } catch (error) {
            console.error('Failed to send invitation:', error)
        } finally {
            setInviting(false)
        }
    }

    const handleCopyLink = () => {
        if (shareLink) {
            navigator.clipboard.writeText(shareLink)
            setLinkCopied(true)
            setTimeout(() => setLinkCopied(false), 2000)
        }
    }

    const roleOptions = [
        {
            value: 'viewer',
            label: 'Viewer',
            icon: Eye,
            description: 'Can view data and dashboards',
            color: 'text-gray-600'
        },
        {
            value: 'editor',
            label: 'Editor',
            icon: Users,
            description: 'Can edit data and create dashboards',
            color: 'text-blue-600'
        },
        {
            value: 'owner',
            label: 'Owner',
            icon: Shield,
            description: 'Full access including workspace settings',
            color: 'text-purple-600'
        }
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Invite to Workspace</h2>
                            <p className="text-sm text-gray-500">{currentWorkspace.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Invitation Form */}
                    <form onSubmit={handleInvite} className="mb-6">
                        <div className="space-y-4">
                            {/* Email Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="colleague@example.com"
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                        disabled={inviting}
                                    />
                                </div>
                            </div>

                            {/* Role Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Select Role
                                </label>
                                <div className="grid grid-cols-1 gap-3">
                                    {roleOptions.map((option) => {
                                        const Icon = option.icon
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setRole(option.value)}
                                                disabled={inviting}
                                                className={`p-4 border-2 rounded-xl text-left transition-all ${role === option.value
                                                        ? 'border-gray-800 bg-gray-50'
                                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                                    } disabled:opacity-50`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <Icon className={`w-5 h-5 mt-0.5 ${option.color}`} />
                                                        <div>
                                                            <div className="font-medium text-gray-900">{option.label}</div>
                                                            <div className="text-sm text-gray-500 mt-0.5">{option.description}</div>
                                                        </div>
                                                    </div>
                                                    {role === option.value && (
                                                        <div className="w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center">
                                                            <Check className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Success Message */}
                        {invited && (
                            <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-green-900">Invitation sent!</div>
                                        <div className="text-sm text-green-700 mt-1">
                                            User can accept the invitation from their dashboard notifications.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Share Link */}
                        {shareLink && (
                            <div className="mt-4 p-4 bg-gray-50 border-2 border-green-200 rounded-xl">
                                <div className="text-sm font-medium text-gray-700 mb-2">Manually Share Token/Link</div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={shareLink}
                                        readOnly
                                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCopyLink}
                                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                                    >
                                        {linkCopied ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <CopyIcon className="w-4 h-4" />
                                                Copy
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                type="submit"
                                disabled={!email || inviting}
                                className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {inviting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-5 h-5" />
                                        Send Invitation
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Pending Invitations */}
                    {outgoingInvitations.length > 0 && (
                        <div className="border-t pt-6">
                            <h3 className="font-medium text-gray-900 mb-4">Pending Invitations (Sent)</h3>
                            <div className="space-y-2">
                                {outgoingInvitations.map((invitation) => (
                                    <div
                                        key={invitation.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                <Mail className="w-4 h-4 text-gray-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{invitation.email}</div>
                                                <div className="text-sm text-gray-500">
                                                    Role: {invitation.role} • Sent {new Date(invitation.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Cancel functionality is not yet implemented in WorkspaceContext, keep it simple UI for now */}
                                        <div className="text-xs text-gray-400">
                                            Pending
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Info Note */}
                    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                        <p className="text-xs text-gray-600">
                            <strong>Note:</strong> Since email service is not configured, the user must log in to their dashboard to see the invitation, or you can copy and share the link manually.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
