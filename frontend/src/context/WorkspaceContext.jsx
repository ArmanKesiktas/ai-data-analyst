import { useState, useEffect, createContext, useContext } from 'react'

// Workspace Context
const WorkspaceContext = createContext(null)

export function useWorkspace() {
    return useContext(WorkspaceContext)
}

// Sample sales data generator
const generateSampleSalesData = () => {
    const products = [
        { name: 'Laptop', category: 'Electronics', minPrice: 800, maxPrice: 1500 },
        { name: 'Phone', category: 'Electronics', minPrice: 400, maxPrice: 1000 },
        { name: 'Headphones', category: 'Electronics', minPrice: 50, maxPrice: 300 },
        { name: 'T-Shirt', category: 'Clothing', minPrice: 15, maxPrice: 50 },
        { name: 'Jeans', category: 'Clothing', minPrice: 40, maxPrice: 120 },
        { name: 'Sneakers', category: 'Clothing', minPrice: 60, maxPrice: 200 },
        { name: 'Coffee', category: 'Food', minPrice: 5, maxPrice: 15 },
        { name: 'Sandwich', category: 'Food', minPrice: 8, maxPrice: 20 },
        { name: 'Desk', category: 'Furniture', minPrice: 150, maxPrice: 500 },
        { name: 'Chair', category: 'Furniture', minPrice: 80, maxPrice: 300 }
    ]

    const regions = ['North', 'South', 'East', 'West']
    const salespeople = ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Emma Brown']

    const data = []
    const today = new Date()

    // Generate 100 rows of sample data for the last 90 days
    for (let i = 0; i < 100; i++) {
        const product = products[Math.floor(Math.random() * products.length)]
        const daysAgo = Math.floor(Math.random() * 90)
        const saleDate = new Date(today)
        saleDate.setDate(saleDate.getDate() - daysAgo)

        const quantity = Math.floor(Math.random() * 5) + 1
        const price = Math.floor(Math.random() * (product.maxPrice - product.minPrice)) + product.minPrice
        const total = quantity * price

        data.push({
            id: i + 1,
            date: saleDate.toISOString().split('T')[0],
            product: product.name,
            category: product.category,
            quantity: quantity,
            price: price,
            total: total,
            region: regions[Math.floor(Math.random() * regions.length)],
            salesperson: salespeople[Math.floor(Math.random() * salespeople.length)]
        })
    }

    return data.sort((a, b) => new Date(b.date) - new Date(a.date))
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

    // Create sample sales table for new users
    const sampleSalesTable = {
        name: 'sales',
        displayName: 'Sample Sales Data',
        description: 'Sample sales data for testing - 100 rows across 90 days',
        rowCount: 100,
        columns: [
            { name: 'id', type: 'number', displayName: 'ID' },
            { name: 'date', type: 'date', displayName: 'Sale Date' },
            { name: 'product', type: 'string', displayName: 'Product' },
            { name: 'category', type: 'string', displayName: 'Category' },
            { name: 'quantity', type: 'number', displayName: 'Quantity' },
            { name: 'price', type: 'number', displayName: 'Price' },
            { name: 'total', type: 'number', displayName: 'Total' },
            { name: 'region', type: 'string', displayName: 'Region' },
            { name: 'salesperson', type: 'string', displayName: 'Salesperson' }
        ],
        data: generateSampleSalesData(),
        createdAt: new Date().toISOString(),
        isSampleData: true
    }

    return [
        {
            id: 1,
            name: 'My Workspace',
            role: 'owner',
            tables: [sampleSalesTable],
            createdAt: new Date().toISOString()
        }
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
    const [pendingInvitations, setPendingInvitations] = useState(() => {
        const saved = localStorage.getItem('pendingInvitations')
        return saved ? JSON.parse(saved) : []
    })

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

    useEffect(() => {
        localStorage.setItem('pendingInvitations', JSON.stringify(pendingInvitations))
    }, [pendingInvitations])

    const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0]

    // Workspace actions
    const createWorkspace = (name) => {
        const newWorkspace = {
            id: Date.now(),
            name,
            role: 'owner', // owner | editor | viewer
            members: [],
            tables: [], // Empty tables array - each workspace starts fresh
            createdAt: new Date().toISOString()
        }
        setWorkspaces(prev => [...prev, newWorkspace])
        setCurrentWorkspaceId(newWorkspace.id)
        addNotification(`Workspace "${name}" created!`, 'success')
        return newWorkspace
    }

    // Table management actions
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

        // Check if table already exists in target workspace
        const tableExists = (targetWorkspace.tables || []).some(t => t.name === tableName)
        if (tableExists) {
            addNotification(`Table "${tableName}" already exists in "${targetWorkspace.name}"`, 'error')
            return false
        }

        // Copy table data
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

    // Invitation actions
    const inviteToWorkspace = (workspaceId, email, role, inviteToken) => {
        const newInvitation = {
            id: Date.now(),
            workspaceId,
            email,
            role,
            token: inviteToken,
            sentAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        }
        setPendingInvitations(prev => [...prev, newInvitation])
        addNotification(`Invitation sent to ${email}`, 'success')
    }

    const cancelInvitation = (invitationId) => {
        const invitation = pendingInvitations.find(inv => inv.id === invitationId)
        setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationId))
        if (invitation) {
            addNotification(`Invitation to ${invitation.email} cancelled`, 'info')
        }
    }

    const acceptInvitation = (inviteToken) => {
        const invitation = pendingInvitations.find(inv => inv.token === inviteToken)
        if (!invitation) {
            addNotification('Invalid invitation', 'error')
            return false
        }

        // Check if expired
        if (new Date(invitation.expiresAt) < new Date()) {
            addNotification('Invitation has expired', 'error')
            setPendingInvitations(prev => prev.filter(inv => inv.id !== invitation.id))
            return false
        }

        // Add user to workspace
        setWorkspaces(prev => prev.map(w => {
            if (w.id === invitation.workspaceId) {
                return {
                    ...w,
                    members: [...(w.members || []), {
                        email: invitation.email,
                        role: invitation.role,
                        joinedAt: new Date().toISOString()
                    }]
                }
            }
            return w
        }))

        // Remove invitation
        setPendingInvitations(prev => prev.filter(inv => inv.id !== invitation.id))
        addNotification('Successfully joined workspace!', 'success')
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
