import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { supabase } from '../lib/supabase'

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
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Check session on mount and listen for auth changes
    useEffect(() => {
        // Get initial session
        const initAuth = async () => {
            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession()

                if (currentSession) {
                    setSession(currentSession)
                    setUser({
                        id: currentSession.user.id,
                        email: currentSession.user.email,
                        full_name: currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0]
                    })
                    // Set axios default header for backend API calls
                    axios.defaults.headers.common['Authorization'] = `Bearer ${currentSession.access_token}`
                }
            } catch (err) {
                console.error('Auth init error:', err)
            } finally {
                setLoading(false)
            }
        }

        initAuth()

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                console.log('Auth event:', event)

                if (currentSession) {
                    setSession(currentSession)
                    setUser({
                        id: currentSession.user.id,
                        email: currentSession.user.email,
                        full_name: currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0]
                    })
                    axios.defaults.headers.common['Authorization'] = `Bearer ${currentSession.access_token}`
                } else {
                    setSession(null)
                    setUser(null)
                    delete axios.defaults.headers.common['Authorization']
                }

                setLoading(false)
            }
        )

        return () => {
            subscription?.unsubscribe()
        }
    }, [])

    const login = async (email, password) => {
        setError(null)
        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: email.toLowerCase(),
                password
            })

            if (authError) {
                setError(authError.message)
                return { success: false, error: authError.message }
            }

            return { success: true }
        } catch (err) {
            const message = err.message || 'Login failed'
            setError(message)
            return { success: false, error: message }
        }
    }

    const register = async (email, password, fullName) => {
        setError(null)
        try {
            const { data, error: authError } = await supabase.auth.signUp({
                email: email.toLowerCase(),
                password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            })

            if (authError) {
                setError(authError.message)
                return { success: false, error: authError.message }
            }

            // Check if email confirmation is required
            if (data.user && !data.session) {
                return {
                    success: true,
                    message: 'Please check your email to confirm your account'
                }
            }

            return { success: true }
        } catch (err) {
            const message = err.message || 'Registration failed'
            setError(message)
            return { success: false, error: message }
        }
    }

    const logout = async () => {
        try {
            await supabase.auth.signOut()
            setUser(null)
            setSession(null)
            delete axios.defaults.headers.common['Authorization']
        } catch (err) {
            console.error('Logout error:', err)
        }
    }

    const value = {
        user,
        token: session?.access_token,
        session,
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
