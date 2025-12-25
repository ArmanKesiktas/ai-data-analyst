import { useState, useEffect, createContext, useContext } from 'react'

// Workspace Context
const WorkspaceContext = createContext(null)

export function useWorkspace() {
    return useContext(WorkspaceContext)
}

// Initial data
const getInitialWorkspaces = () => {
    const saved = localStorage.getItem('workspaces')
    if (saved) {
        try {
            return JSON.parse(saved)
        } catch (e) {
            console.error('Error loading workspaces:', e)
        }
    }
    return [
        { id: 1, name: 'My Workspace', role: 'owner', tables: [], createdAt: new Date().toISOString() }
    ]
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
    return [
        { id: 1, message: 'Welcome to QueryMind AI!', time: new Date().toISOString(), unread: true, type: 'info' }
    ]
}

export function WorkspaceProvider({ children }) {
    const [workspaces, setWorkspaces] = useState(getInitialWorkspaces)
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState(() => {
        const saved = localStorage.getItem('currentWorkspaceId')
        return saved ? parseInt(saved) : 1
    })
    const [profile, setProfile] = useState(getInitialProfile)
    const [notifications, setNotifications] = useState(getInitialNotifications)

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('workspaces', JSON.stringify(workspaces))
    }, [workspaces])

    useEffect(() => {
        localStorage.setItem('currentWorkspaceId', currentWorkspaceId.toString())
    }, [currentWorkspaceId])

    useEffect(() => {
        localStorage.setItem('userProfile', JSON.stringify(profile))
    }, [profile])

    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications))
    }, [notifications])

    const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0]

    // Workspace actions
    const createWorkspace = (name) => {
        const newWorkspace = {
            id: Date.now(),
            name,
            role: 'owner', // owner | editor | viewer
            members: [],
            tables: [],
            createdAt: new Date().toISOString()
        }
        setWorkspaces(prev => [...prev, newWorkspace])
        setCurrentWorkspaceId(newWorkspace.id)
        addNotification(`Workspace "${name}" created!`, 'success')
        return newWorkspace
    }

    const deleteWorkspace = (id) => {
        if (workspaces.length <= 1) {
            addNotification('Cannot delete the last workspace', 'error')
            return false
        }
        const ws = workspaces.find(w => w.id === id)
        setWorkspaces(prev => prev.filter(w => w.id !== id))
        if (currentWorkspaceId === id) {
            setCurrentWorkspaceId(workspaces.find(w => w.id !== id)?.id || 1)
        }
        addNotification(`Workspace "${ws?.name}" deleted`, 'info')
        return true
    }

    const renameWorkspace = (id, newName) => {
        setWorkspaces(prev => prev.map(w =>
            w.id === id ? { ...w, name: newName } : w
        ))
    }

    // Profile actions
    const updateProfile = (updates) => {
        setProfile(prev => ({ ...prev, ...updates }))
        addNotification('Profile updated successfully!', 'success')
    }

    // Notification actions
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

    const value = {
        // Workspaces
        workspaces,
        currentWorkspace,
        currentWorkspaceId,
        setCurrentWorkspaceId,
        createWorkspace,
        deleteWorkspace,
        renameWorkspace,

        // Profile
        profile,
        updateProfile,

        // Notifications
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        unreadCount: notifications.filter(n => n.unread).length
    }

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    )
}
