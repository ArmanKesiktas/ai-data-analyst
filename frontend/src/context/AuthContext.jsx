import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const AuthContext = createContext(null)

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(localStorage.getItem('token'))
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Check if user is authenticated on mount
    useEffect(() => {
        const checkAuth = async () => {
            const savedToken = localStorage.getItem('token')
            if (savedToken) {
                try {
                    const response = await axios.get(`${API_URL}/api/auth/me`, {
                        headers: { Authorization: `Bearer ${savedToken}` }
                    })
                    setUser(response.data)
                    setToken(savedToken)
                } catch (err) {
                    // Token is invalid or expired
                    localStorage.removeItem('token')
                    setToken(null)
                    setUser(null)
                }
            }
            setLoading(false)
        }

        checkAuth()
    }, [])

    // Set axios default header when token changes
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } else {
            delete axios.defaults.headers.common['Authorization']
        }
    }, [token])

    const login = async (email, password) => {
        setError(null)
        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, {
                email,
                password
            })

            const { access_token, user: userData } = response.data

            localStorage.setItem('token', access_token)
            setToken(access_token)
            setUser(userData)

            return { success: true }
        } catch (err) {
            const message = err.response?.data?.detail || 'Login failed'
            setError(message)
            return { success: false, error: message }
        }
    }

    const register = async (email, password, fullName) => {
        setError(null)
        try {
            const response = await axios.post(`${API_URL}/api/auth/register`, {
                email,
                password,
                full_name: fullName
            })

            const { access_token, user: userData } = response.data

            localStorage.setItem('token', access_token)
            setToken(access_token)
            setUser(userData)

            return { success: true }
        } catch (err) {
            const message = err.response?.data?.detail || 'Registration failed'
            setError(message)
            return { success: false, error: message }
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
        delete axios.defaults.headers.common['Authorization']
    }

    const value = {
        user,
        token,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        clearError: () => setError(null)
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
