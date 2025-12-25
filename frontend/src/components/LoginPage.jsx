import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, User, Loader2, ArrowRight, LayoutDashboard, Sparkles, FileSpreadsheet } from 'lucide-react'

function LoginPage() {
    const { login, register, error, clearError } = useAuth()
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)

    // Form fields
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [formError, setFormError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setFormError('')
        clearError()

        // Validation
        if (!email || !password) {
            setFormError('Email and password are required')
            return
        }

        if (!isLogin) {
            if (!fullName) {
                setFormError('Full name is required')
                return
            }
            if (password !== confirmPassword) {
                setFormError('Passwords do not match')
                return
            }
            if (password.length < 6) {
                setFormError('Password must be at least 6 characters')
                return
            }
        }

        setLoading(true)

        try {
            if (isLogin) {
                await login(email, password)
            } else {
                await register(email, password, fullName)
            }
        } finally {
            setLoading(false)
        }
    }

    const toggleMode = () => {
        setIsAnimating(true)
        setTimeout(() => {
            setIsLogin(!isLogin)
            setFormError('')
            clearError()
        }, 150)
        setTimeout(() => {
            setIsAnimating(false)
        }, 300)
    }

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
            {/* CSS for animations */}
            <style>{`
                @keyframes formTransition {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(0.95); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .form-animating {
                    animation: formTransition 0.3s ease-in-out;
                }
            `}</style>

            {/* Left Panel - Branding (Dark Background - White Logo) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-12 flex-col justify-between relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/20 blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl"></div>
                </div>

                {/* Logo - White version for dark background */}
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <img
                            src="/quantywhite.png"
                            alt="Quanty Logo"
                            className="h-8 w-auto"
                        />
                    </div>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 space-y-8">
                    <h1 className="text-5xl font-bold leading-tight">
                        Analyze Your<br />
                        <span className="bg-gradient-to-t from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">Data with AI</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-md">
                        Ask questions in natural language, get instant insights.
                        No SQL knowledge required.
                    </p>

                    {/* Features */}
                    <div className="space-y-4 pt-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                <LayoutDashboard className="w-5 h-5 text-gray-300" />
                            </div>
                            <span className="text-gray-300">Dynamic Dashboard Builder</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-gray-300" />
                            </div>
                            <span className="text-gray-300">AI-Powered Data Analysis</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                <FileSpreadsheet className="w-5 h-5 text-gray-300" />
                            </div>
                            <span className="text-gray-300">CSV/Excel File Support</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 text-gray-500 text-sm">
                    © 2024 Quanty. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Form (White Background - Black Logo) */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    {/* Mobile Logo - Black version for white background */}
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <img
                            src="/quantyblack.png"
                            alt="Quanty Logo"
                            className="h-8 w-auto"
                        />
                    </div>

                    {/* Form Card with Animation */}
                    <div className={`bg-white rounded-2xl shadow-xl p-8 border border-gray-100 transition-all duration-300 ${isAnimating ? 'form-animating' : ''}`}>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {isLogin ? 'Welcome Back' : 'Create Account'}
                            </h2>
                            <p className="text-gray-500 mt-2">
                                {isLogin
                                    ? 'Sign in to your account'
                                    : 'Get started for free'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Full Name - Only for Register */}
                            <div className={`transition-all duration-300 overflow-hidden ${!isLogin ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Confirm Password - Only for Register */}
                            <div className={`transition-all duration-300 overflow-hidden ${!isLogin ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Error Message */}
                            {(formError || error) && (
                                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-shake">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {formError || error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Toggle Mode */}
                        <div className="mt-6 text-center text-sm">
                            <span className="text-gray-500">
                                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                            </span>
                            <button
                                onClick={toggleMode}
                                className="ml-2 text-gray-900 font-medium hover:underline transition-all hover:scale-105"
                            >
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
