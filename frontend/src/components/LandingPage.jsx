import { useState } from 'react'
import {
    ArrowRight,
    BarChart3,
    Sparkles,
    Upload,
    LayoutDashboard,
    Shield,
    Zap,
    Database,
    TrendingUp,
    Users,
    ChevronDown,
    Play,
    Check,
    PieChart,
    LineChart,
    Activity,
    Table2
} from 'lucide-react'

export default function LandingPage({ onGetStarted }) {
    const [activeScreenshot, setActiveScreenshot] = useState(0)

    const features = [
        {
            icon: Sparkles,
            title: 'AI-Powered Analysis',
            description: 'Ask questions in natural language. Our AI understands your data and generates insights instantly.'
        },
        {
            icon: Upload,
            title: 'Easy Data Import',
            description: 'Upload CSV or Excel files with drag & drop. Your data is ready in seconds.'
        },
        {
            icon: LayoutDashboard,
            title: 'Dynamic Dashboards',
            description: 'Create beautiful, interactive dashboards with just a description. No coding required.'
        },
        {
            icon: Shield,
            title: 'Secure & Private',
            description: 'Your data stays secure with enterprise-grade encryption and authentication.'
        },
        {
            icon: Zap,
            title: 'Lightning Fast',
            description: 'Get results in milliseconds. Optimized query engine for maximum performance.'
        },
        {
            icon: Database,
            title: 'Multiple Tables',
            description: 'Work with multiple datasets simultaneously. Cross-reference and analyze together.'
        }
    ]

    const stats = [
        { value: '10x', label: 'Faster Analysis' },
        { value: '0', label: 'SQL Knowledge Required' },
        { value: '100%', label: 'AI Powered' },
        { value: '∞', label: 'Possibilities' }
    ]

    const screenshots = [
        {
            id: 'query',
            title: 'Natural Language Queries',
            description: 'Ask anything about your data in plain English',
            placeholder: '/screenshots/query.png'
        },
        {
            id: 'dashboard',
            title: 'AI Dashboard Builder',
            description: 'Create stunning dashboards with a single prompt',
            placeholder: '/screenshots/dashboard.png'
        },
        {
            id: 'table',
            title: 'Data Management',
            description: 'View, edit, and manage your data tables',
            placeholder: '/screenshots/table.png'
        }
    ]

    return (
        <div className="min-h-screen bg-white scroll-smooth">
            {/* Global smooth scroll CSS */}
            <style>{`
                html { scroll-behavior: smooth; }
                * { scroll-behavior: smooth; }
            `}</style>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/quantyblack.png" alt="Quanty" className="h-6 w-auto" />
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors duration-300 text-sm font-medium">Features</a>
                        <a href="#screenshots" className="text-gray-600 hover:text-gray-900 transition-colors duration-300 text-sm font-medium">Product</a>
                        <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors duration-300 text-sm font-medium">Pricing</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onGetStarted}
                            className="text-gray-600 hover:text-gray-900 transition-colors duration-300 text-sm font-medium"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={onGetStarted}
                            className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105"
                        >
                            Get Started Free
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white -z-10"></div>
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30 -z-10"></div>
                <div className="absolute top-40 right-1/4 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-30 -z-10"></div>

                {/* Data-inspired floating icons - visible on first view */}
                <div className="absolute inset-0 -z-5 overflow-hidden pointer-events-none">
                    {/* TOP AREA - 10 icons visible immediately */}
                    <BarChart3 className="absolute top-36 left-[5%] w-14 h-14 text-gray-200 opacity-35 rotate-12" />
                    <PieChart className="absolute top-32 left-[16%] w-10 h-10 text-gray-200 opacity-25 -rotate-6" />
                    <LineChart className="absolute top-40 left-[26%] w-8 h-8 text-gray-200 opacity-22 rotate-3" />
                    <Activity className="absolute top-28 right-[26%] w-9 h-9 text-gray-200 opacity-25" />
                    <TrendingUp className="absolute top-36 right-[16%] w-11 h-11 text-gray-200 opacity-30 -rotate-12" />
                    <Database className="absolute top-32 right-[6%] w-13 h-13 text-gray-200 opacity-28 rotate-6" />
                    <Table2 className="absolute top-44 left-[10%] w-7 h-7 text-gray-200 opacity-20 -rotate-3" />
                    <PieChart className="absolute top-48 right-[8%] w-8 h-8 text-gray-200 opacity-22 rotate-12" />
                    <BarChart3 className="absolute top-52 left-[4%] w-6 h-6 text-gray-200 opacity-18 -rotate-6" />
                    <LineChart className="absolute top-44 right-[20%] w-6 h-6 text-gray-200 opacity-20 rotate-3" />

                    {/* MID-LOWER area */}
                    <Activity className="absolute top-[50%] left-[4%] w-10 h-10 text-gray-200 opacity-22 rotate-6" />
                    <Database className="absolute top-[60%] left-[8%] w-8 h-8 text-gray-200 opacity-20 -rotate-12" />
                    <TrendingUp className="absolute top-[70%] left-[5%] w-7 h-7 text-gray-200 opacity-18 rotate-3" />
                    <PieChart className="absolute top-[55%] right-[5%] w-9 h-9 text-gray-200 opacity-22 -rotate-6" />
                    <BarChart3 className="absolute top-[65%] right-[10%] w-6 h-6 text-gray-200 opacity-18 rotate-12" />
                    <Table2 className="absolute top-[75%] right-[4%] w-8 h-8 text-gray-200 opacity-20 -rotate-3" />
                </div>

                <div className="max-w-7xl mx-auto text-center">
                    {/* Headline */}
                    <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-6">
                        Analyze Your Data
                        <br />
                        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            With AI
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                        Transform complex data into actionable insights. Just ask questions in plain English —
                        no SQL, no code, no complexity.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <button
                            onClick={onGetStarted}
                            className="group bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 hover:scale-105 flex items-center gap-2"
                        >
                            Start Free Trial
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </button>
                        <button className="group text-gray-600 hover:text-gray-900 px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 flex items-center gap-2">
                            <Play className="w-5 h-5" />
                            Watch Demo
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto mb-20">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{stat.value}</div>
                                <div className="text-sm text-gray-500">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Hero Screenshot */}
                    <div className="relative max-w-5xl mx-auto">
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-20"></div>
                        <div className="relative bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
                            {/* Browser Chrome */}
                            <div className="bg-gray-800 px-4 py-3 flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <div className="flex-1 bg-gray-700 rounded-lg px-4 py-1.5 text-sm text-gray-400 text-center">
                                    quanty.app/dashboard
                                </div>
                            </div>
                            {/* Screenshot Image */}
                            <div className="aspect-[16/10] bg-gradient-to-br from-gray-800 to-gray-900">
                                <img
                                    src="/screenshots/dashboard.png"
                                    alt="Dashboard Screenshot"
                                    className="w-full h-full object-cover object-top"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                <div className="hidden items-center justify-center h-full">
                                    <div className="text-center p-8">
                                        <BarChart3 className="w-24 h-24 text-gray-700 mx-auto mb-4" />
                                        <p className="text-gray-500 text-lg">Dashboard Screenshot</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Scroll Indicator */}
            <div className="flex justify-center py-8">
                <a href="#features" className="text-gray-400 hover:text-gray-600 transition-colors duration-300 animate-bounce">
                    <ChevronDown className="w-6 h-6" />
                </a>
            </div>

            {/* Features Section */}
            <section id="features" className="py-24 px-6 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Everything You Need
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Powerful features designed to make data analysis accessible to everyone
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-6">
                                    <feature.icon className="w-6 h-6 text-gray-700" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Screenshots Section */}
            <section id="screenshots" className="py-24 px-6 relative overflow-hidden">
                {/* Data-inspired floating icons for screenshots section */}
                <div className="absolute inset-0 -z-5 overflow-hidden pointer-events-none">
                    <PieChart className="absolute top-20 left-[5%] w-14 h-14 text-gray-100 opacity-50 rotate-12" />
                    <TrendingUp className="absolute bottom-20 right-[8%] w-12 h-12 text-gray-100 opacity-40 -rotate-6" />
                </div>

                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            See It In Action
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Explore the powerful features that make data analysis effortless
                        </p>
                    </div>

                    {/* Screenshot Tabs */}
                    <div className="flex justify-center gap-4 mb-12">
                        {screenshots.map((screen, idx) => (
                            <button
                                key={screen.id}
                                onClick={() => setActiveScreenshot(idx)}
                                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${activeScreenshot === idx
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {screen.title}
                            </button>
                        ))}
                    </div>

                    {/* Screenshot Display */}
                    <div className="relative max-w-5xl mx-auto">
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-10"></div>
                        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 transition-all duration-500">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {screenshots[activeScreenshot].title}
                                </h3>
                                <p className="text-gray-600 mt-1">
                                    {screenshots[activeScreenshot].description}
                                </p>
                            </div>
                            <div className="aspect-[16/10] bg-gray-50 overflow-hidden">
                                <img
                                    src={screenshots[activeScreenshot].placeholder}
                                    alt={screenshots[activeScreenshot].title}
                                    className="w-full h-full object-cover object-top"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                <div className="hidden items-center justify-center h-full">
                                    <div className="text-center p-8">
                                        <LayoutDashboard className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-400">Screenshot not found</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6 bg-gray-900 relative overflow-hidden">
                {/* Subtle data icons in dark section */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <BarChart3 className="absolute top-10 left-[10%] w-20 h-20 text-white opacity-5 rotate-12" />
                    <PieChart className="absolute bottom-10 right-[10%] w-16 h-16 text-white opacity-5 -rotate-12" />
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Ready to Transform Your Data?
                    </h2>
                    <p className="text-xl text-gray-400 mb-10">
                        Join thousands of analysts who are already using Quanty to unlock insights from their data.
                    </p>
                    <button
                        onClick={onGetStarted}
                        className="group bg-white hover:bg-gray-100 text-gray-900 px-10 py-5 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105 inline-flex items-center gap-3"
                    >
                        Get Started for Free
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                    <p className="text-gray-500 mt-6 text-sm">
                        No credit card required • Free forever plan available
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-gray-100">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <img src="/quantyblack.png" alt="Quanty" className="h-5 w-auto" />
                        <span className="text-gray-500 text-sm">© 2024 Quanty. All rights reserved.</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                        <a href="#" className="hover:text-gray-900 transition-colors duration-300">Privacy</a>
                        <a href="#" className="hover:text-gray-900 transition-colors duration-300">Terms</a>
                        <a href="#" className="hover:text-gray-900 transition-colors duration-300">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
