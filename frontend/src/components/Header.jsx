import { useState, useEffect } from 'react'
import axios from 'axios'
import { Bell, User, ChevronDown, FolderOpen, Users, Settings, LogOut, Plus, Check, CheckCheck, Trash2, Moon, Sun, Menu, UserPlus, Mail } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import CreateWorkspaceModal from './CreateWorkspaceModal'
import ProfileSettingsModal from './ProfileSettingsModal'
import InviteToWorkspaceModal from './InviteToWorkspaceModal'
import EnhancedProfileSettings from './EnhancedProfileSettings'
import GeneralSettingsModal from './GeneralSettingsModal'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Theme Toggle Component
function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            data-tour="theme-toggle"
            className="p-2 rounded-lg transition-colors"
            style={{
                backgroundColor: theme === 'dark' ? 'var(--bg-tertiary)' : 'transparent',
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {theme === 'dark' ? (
                <Sun className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            ) : (
                <Moon className="w-5 h-5 text-gray-500" />
            )}
        </button>
    )
}

export default function Header({ onMenuClick }) {
    const {
        workspaces,
        currentWorkspace,
        setCurrentWorkspaceId,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        profile,
        pendingInvitations,
        acceptInvitation,
        fetchPendingInvitations
    } = useWorkspace()

    const { user, logout } = useAuth()

    const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)
    const [showProfileSettings, setShowProfileSettings] = useState(false)
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [showEnhancedSettings, setShowEnhancedSettings] = useState(false)
    const [showGeneralSettings, setShowGeneralSettings] = useState(false)

    // Fetch invitations on mount and when user changes
    useEffect(() => {
        if (user) {
            fetchPendingInvitations()
        }
    }, [user])

    // Accept invitation handler
    const handleAcceptInvitation = async (token) => {
        await acceptInvitation(token)
    }

    const formatTime = (isoString) => {
        const date = new Date(isoString)
        const now = new Date()
        const diff = now - date

        if (diff < 60000) return 'Just now'
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
        return date.toLocaleDateString()
    }

    // Total badge count includes invitations
    const totalBadgeCount = unreadCount + (pendingInvitations?.length || 0)

    return (
        <>
            <header className="h-14 border-b flex items-center justify-between px-4 md:px-6 flex-shrink-0" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                {/* Left - Mobile Menu + Workspace Selector */}
                <div className="flex items-center gap-2">
                    {/* Mobile Hamburger Menu */}
                    {onMenuClick && (
                        <button
                            onClick={onMenuClick}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    )}

                    {/* Workspace Selector - Hidden on very small screens */}
                    <div className="relative hidden sm:block">
                        <button
                            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <FolderOpen className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-700">{currentWorkspace?.name || 'Select Workspace'}</span>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>

                        {showWorkspaceMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowWorkspaceMenu(false)} />
                                <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 animate-dropdown">
                                    <div className="p-2">
                                        <p className="text-xs text-gray-400 px-2 py-1 mb-1">Workspaces</p>
                                        {workspaces.map(ws => (
                                            <button
                                                key={ws.id}
                                                onClick={() => {
                                                    setCurrentWorkspaceId(ws.id)
                                                    setShowWorkspaceMenu(false)
                                                }}
                                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FolderOpen className="w-4 h-4 text-gray-400" />
                                                    <div className="text-left">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium text-gray-700">{ws.name}</p>
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ws.role === 'owner' ? 'bg-blue-100 text-blue-600' :
                                                                ws.role === 'editor' ? 'bg-green-100 text-green-600' :
                                                                    'bg-gray-100 text-gray-500'
                                                                }`}>
                                                                {ws.role === 'owner' ? 'Owner' : ws.role === 'editor' ? 'Editor' : 'Viewer'}
                                                            </span>
                                                        </div>
                                                        {ws.members && ws.members.length > 0 && (
                                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                                <Users className="w-3 h-3" /> {ws.members.length} members
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {ws.id === currentWorkspace?.id && (
                                                    <Check className="w-4 h-4 text-green-500" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="border-t border-gray-100 p-2">
                                        <button
                                            onClick={() => {
                                                setShowWorkspaceMenu(false)
                                                setShowInviteModal(true)
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 text-blue-600 text-sm font-medium"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            Invite Members
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowWorkspaceMenu(false)
                                                setShowCreateWorkspace(true)
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-600 text-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Create New Workspace
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-2">
                    {/* Theme Toggle */}
                    <ThemeToggle />
                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 hover:bg-gray-100 rounded-lg relative"
                        >
                            <Bell className="w-5 h-5 text-gray-500" />
                            {totalBadgeCount > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                                    {totalBadgeCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                                <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 animate-dropdown">
                                    <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                                        {notifications.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={markAllAsRead}
                                                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                                                    title="Mark all as read"
                                                >
                                                    <CheckCheck className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={clearNotifications}
                                                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                                                    title="Clear all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Pending Invitations Section */}
                                    {pendingInvitations.length > 0 && (
                                        <div className="border-b border-gray-100">
                                            <p className="text-xs text-gray-400 px-3 pt-2 pb-1 font-medium">Workspace Invitations</p>
                                            {pendingInvitations.map(inv => (
                                                <div key={inv.id} className="p-3 bg-blue-50/50 hover:bg-blue-50 transition-colors">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                                <p className="text-sm font-medium text-gray-800 truncate">{inv.workspace_name}</p>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Role: <span className="capitalize">{inv.role}</span> • From: {inv.invited_by}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleAcceptInvitation(inv.token)}
                                                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors flex-shrink-0"
                                                        >
                                                            Accept
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="max-h-64 overflow-auto">
                                        {notifications.length === 0 && pendingInvitations.length === 0 ? (
                                            <div className="p-6 text-center text-gray-400 text-sm">
                                                No notifications yet
                                            </div>
                                        ) : notifications.length === 0 ? null : (
                                            notifications.map(notif => (
                                                <div
                                                    key={notif.id}
                                                    onClick={() => markAsRead(notif.id)}
                                                    className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${notif.unread ? 'bg-blue-50/50' : ''}`}
                                                >
                                                    <p className="text-sm text-gray-700">{notif.message}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{formatTime(notif.time)}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Profile */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>

                        {showProfileMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 animate-dropdown">
                                    <div className="p-3 border-b border-gray-100">
                                        <p className="font-medium text-gray-800">{user?.full_name || profile.name}</p>
                                        <p className="text-sm text-gray-400">{user?.email || profile.email}</p>
                                    </div>
                                    <div className="p-2">
                                        <button
                                            onClick={() => {
                                                setShowProfileMenu(false)
                                                setShowEnhancedSettings(true)
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 text-sm"
                                        >
                                            <User className="w-4 h-4" />
                                            Account Settings
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowProfileMenu(false)
                                                setShowGeneralSettings(true)
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 text-sm"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Workspace Settings
                                        </button>
                                    </div>
                                    <div className="border-t border-gray-100 p-2">
                                        <button
                                            onClick={() => {
                                                setShowProfileMenu(false)
                                                logout()
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 text-sm"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div >
            </header >

            {/* Modals */}
            {showCreateWorkspace && (
                <CreateWorkspaceModal onClose={() => setShowCreateWorkspace(false)} />
            )}
            {showProfileSettings && (
                <ProfileSettingsModal onClose={() => setShowProfileSettings(false)} />
            )}
            {showInviteModal && (
                <InviteToWorkspaceModal
                    isOpen={showInviteModal}
                    onClose={() => setShowInviteModal(false)}
                />
            )}
            {showEnhancedSettings && (
                <EnhancedProfileSettings onClose={() => setShowEnhancedSettings(false)} />
            )}
            {showGeneralSettings && (
                <GeneralSettingsModal onClose={() => setShowGeneralSettings(false)} />
            )}
        </>
    )
}
