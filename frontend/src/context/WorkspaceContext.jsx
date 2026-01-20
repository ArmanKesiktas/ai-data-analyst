import { useState, useEffect, createContext, useContext } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Workspace Context
const WorkspaceContext = createContext(null)

export function useWorkspace() {
    return useContext(WorkspaceContext)
}

const getInitialProfile = () => {
    const saved = localStorage.getItem('userProfile')
    if (saved) {
        try {
            return JSON.parse(saved)
        } catch (e) {
            console.error('Error loading profile:', e)
        }
    }
    return {
        name: 'User',
        email: 'user@example.com',
        avatar: null
    }
}

const getInitialNotifications = () => {
    const saved = localStorage.getItem('notifications')
    if (saved) {
        try {
            return JSON.parse(saved)
        } catch (e) {
            console.error('Error loading notifications:', e)
        }
    }
    return []
}

export function WorkspaceProvider({ children }) {
    const { token, user } = useAuth()

    // Workspace state - now fetched from backend
    const [workspaces, setWorkspaces] = useState([])
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState(() => {
        const saved = localStorage.getItem('currentWorkspaceId')
        return saved ? parseInt(saved) : null
    })
    const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true)

    // Profile and notifications (still local for now)
    const [profile, setProfile] = useState(getInitialProfile)
    const [notifications, setNotifications] = useState(getInitialNotifications)
    const [pendingInvitations, setPendingInvitations] = useState([])

    // Save to localStorage (only for non-workspace data)
    useEffect(() => {
        if (currentWorkspaceId) {
            localStorage.setItem('currentWorkspaceId', currentWorkspaceId.toString())
        }
    }, [currentWorkspaceId])

    useEffect(() => {
        localStorage.setItem('userProfile', JSON.stringify(profile))
    }, [profile])

    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications))
    }, [notifications])

    // ========== BACKEND API CALLS ==========

    // Fetch workspaces from backend
    const fetchWorkspaces = async () => {
        if (!token) return

        try {
            setIsLoadingWorkspaces(true)
            const response = await axios.get(`${API_URL}/api/workspaces`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setWorkspaces(response.data)

            // Set current workspace if not set or invalid
            const currentExists = response.data.find(w => w.id === currentWorkspaceId)
            if (!currentWorkspaceId || !currentExists) {
                if (response.data.length > 0) {
                    setCurrentWorkspaceId(response.data[0].id)
                }
            }
        } catch (error) {
            console.error('Error fetching workspaces:', error)
            // If unauthorized, don't show error
            if (error.response?.status !== 401) {
                addNotification('Failed to load workspaces', 'error')
            }
        } finally {
            setIsLoadingWorkspaces(false)
        }
    }

    // Fetch pending invitations from backend
    const fetchPendingInvitations = async () => {
        if (!token) return

        try {
            const response = await axios.get(`${API_URL}/api/workspaces/my-invitations`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setPendingInvitations(response.data)
        } catch (error) {
            console.error('Error fetching invitations:', error)
        }
    }

    // Load workspaces when token changes
    useEffect(() => {
        if (token) {
            fetchWorkspaces()
            fetchPendingInvitations()
        } else {
            setWorkspaces([])
            setPendingInvitations([])
            setIsLoadingWorkspaces(false)
        }
    }, [token])

    // Refresh workspaces when auth changes
    const refreshData = () => {
        fetchWorkspaces()
        fetchPendingInvitations()
    }

    const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0]

    // ========== WORKSPACE ACTIONS ==========

    const createWorkspace = async (name, description = '') => {
        try {
            const response = await axios.post(`${API_URL}/api/workspaces`, {
                name,
                description
            })
            const newWorkspace = response.data
            setWorkspaces(prev => [...prev, newWorkspace])
            setCurrentWorkspaceId(newWorkspace.id)
            addNotification(`Workspace "${name}" created!`, 'success')
            return newWorkspace
        } catch (error) {
            console.error('Error creating workspace:', error)
            addNotification(error.response?.data?.detail || 'Failed to create workspace', 'error')
            return null
        }
    }

    const deleteWorkspace = async (id) => {
        if (workspaces.length <= 1) {
            addNotification('Cannot delete the last workspace', 'error')
            return false
        }
        try {
            await axios.delete(`${API_URL}/api/workspaces/${id}`)
            const ws = workspaces.find(w => w.id === id)
            setWorkspaces(prev => prev.filter(w => w.id !== id))
            if (currentWorkspaceId === id) {
                setCurrentWorkspaceId(workspaces.find(w => w.id !== id)?.id || null)
            }
            addNotification(`Workspace "${ws?.name}" deleted`, 'info')
            return true
        } catch (error) {
            console.error('Error deleting workspace:', error)
            addNotification(error.response?.data?.detail || 'Failed to delete workspace', 'error')
            return false
        }
    }

    const renameWorkspace = async (id, newName) => {
        try {
            await axios.put(`${API_URL}/api/workspaces/${id}`, { name: newName })
            setWorkspaces(prev => prev.map(w =>
                w.id === id ? { ...w, name: newName } : w
            ))
            addNotification('Workspace renamed', 'success')
        } catch (error) {
            console.error('Error renaming workspace:', error)
            addNotification(error.response?.data?.detail || 'Failed to rename workspace', 'error')
        }
    }

    // ========== INVITATION ACTIONS ==========

    const inviteToWorkspace = async (workspaceId, email, role) => {
        try {
            const response = await axios.post(`${API_URL}/api/workspaces/${workspaceId}/invitations`, {
                email,
                role
            })
            addNotification(`Invitation sent to ${email}`, 'success')
            return response.data
        } catch (error) {
            console.error('Error sending invitation:', error)
            addNotification(error.response?.data?.detail || 'Failed to send invitation', 'error')
            return null
        }
    }

    const acceptInvitation = async (token) => {
        try {
            const response = await axios.post(`${API_URL}/api/workspaces/invitations/accept`, { token })
            // Refresh workspaces to include the new one
            await fetchWorkspaces()
            // Remove from pending invitations
            setPendingInvitations(prev => prev.filter(inv => inv.token !== token))
            addNotification('Successfully joined workspace!', 'success')
            // Switch to the new workspace
            if (response.data.workspace_id) {
                setCurrentWorkspaceId(response.data.workspace_id)
            }
            return true
        } catch (error) {
            console.error('Error accepting invitation:', error)
            addNotification(error.response?.data?.detail || 'Failed to accept invitation', 'error')
            return false
        }
    }

    const cancelInvitation = async (workspaceId, invitationId) => {
        // TODO: Add cancel invitation endpoint if needed
        addNotification('Invitation cancelled', 'info')
    }

    // ========== PROFILE ACTIONS ==========

    const updateProfile = (updates) => {
        setProfile(prev => ({ ...prev, ...updates }))
        addNotification('Profile updated successfully!', 'success')
    }

    // ========== NOTIFICATION ACTIONS ==========

    const addNotification = (message, type = 'info') => {
        const newNotif = {
            id: Date.now(),
            message,
            time: new Date().toISOString(),
            unread: true,
            type
        }
        setNotifications(prev => [newNotif, ...prev.slice(0, 49)])
    }

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, unread: false } : n
        ))
    }

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
    }

    const clearNotifications = () => {
        setNotifications([])
    }

    // ========== TABLE MANAGEMENT (Local only for now) ==========

    const addTableToWorkspace = (workspaceId, tableData) => {
        setWorkspaces(prev => prev.map(w =>
            w.id === workspaceId
                ? { ...w, tables: [...(w.tables || []), tableData] }
                : w
        ))
        addNotification(`Table "${tableData.name}" added to workspace`, 'success')
    }

    const removeTableFromWorkspace = (workspaceId, tableName) => {
        setWorkspaces(prev => prev.map(w =>
            w.id === workspaceId
                ? { ...w, tables: (w.tables || []).filter(t => t.name !== tableName) }
                : w
        ))
        addNotification(`Table "${tableName}" removed`, 'info')
    }

    const copyTableToWorkspace = (sourceWorkspaceId, targetWorkspaceId, tableName) => {
        const sourceWorkspace = workspaces.find(w => w.id === sourceWorkspaceId)
        const targetWorkspace = workspaces.find(w => w.id === targetWorkspaceId)

        if (!sourceWorkspace || !targetWorkspace) {
            addNotification('Workspace not found', 'error')
            return false
        }

        const tableToCopy = (sourceWorkspace.tables || []).find(t => t.name === tableName)
        if (!tableToCopy) {
            addNotification('Table not found', 'error')
            return false
        }

        const tableExists = (targetWorkspace.tables || []).some(t => t.name === tableName)
        if (tableExists) {
            addNotification(`Table "${tableName}" already exists in "${targetWorkspace.name}"`, 'error')
            return false
        }

        const copiedTable = {
            ...tableToCopy,
            copiedFrom: sourceWorkspace.name,
            copiedAt: new Date().toISOString()
        }

        setWorkspaces(prev => prev.map(w =>
            w.id === targetWorkspaceId
                ? { ...w, tables: [...(w.tables || []), copiedTable] }
                : w
        ))

        addNotification(
            `Table "${tableName}" copied to "${targetWorkspace.name}"`,
            'success'
        )
        return true
    }

    const value = {
        // Workspaces
        workspaces,
        currentWorkspace,
        currentWorkspaceId,
        setCurrentWorkspaceId,
        createWorkspace,
        deleteWorkspace,
        renameWorkspace,
        isLoadingWorkspaces,
        refreshData,

        // Table Management
        addTableToWorkspace,
        removeTableFromWorkspace,
        copyTableToWorkspace,

        // Profile
        profile,
        updateProfile,

        // Notifications
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        unreadCount: notifications.filter(n => n.unread).length,

        // Invitations
        pendingInvitations,
        fetchPendingInvitations,
        inviteToWorkspace,
        cancelInvitation,
        acceptInvitation
    }

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    )
}
