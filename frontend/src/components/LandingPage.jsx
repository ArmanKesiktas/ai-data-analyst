import { useState, useEffect } from 'react'
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
    Table2,
    ChevronLeft,
    ChevronRight as ChevronRightIcon
} from 'lucide-react'
import FloatingGradientOrb from './FloatingGradientOrb'

export default function LandingPage({ onGetStarted }) {
    const [activeScreenshot, setActiveScreenshot] = useState(0)
    const [isPaused, setIsPaused] = useState(false)

    // Auto-advance carousel every 4 seconds
    useEffect(() => {
        if (isPaused) return

        const interval = setInterval(() => {
            setActiveScreenshot(prev => (prev + 1) % 3)
        }, 4000)

        return () => clearInterval(interval)
    }, [isPaused])

    const features = [
        {
            icon: Table2,
            title: 'Build Your Own Data Models—No Database Skills Required',
            description: 'Start with a blank canvas or upload CSVs. Define fields, set data types, add rows manually or in bulk. Quanty gives you spreadsheet-like simplicity with database-grade structure.'
        },
        {
            icon: Sparkles,
            title: 'Ask Questions, Get Answers—In Seconds',
            description: 'Type natural language queries like "What were our top products last month?" AI generates the SQL, runs the analysis, and creates charts automatically. No training needed.'
        },
        {
            icon: Users,
            title: 'Work Together in Isolated, Secure Workspaces',
            description: 'Create dedicated workspaces for each project or team. Invite members with role-based permissions (Owner, Editor, Viewer). Data stays private within each workspace—perfect for multi-client or multi-project setups.'
        },
        {
            icon: LayoutDashboard,
            title: 'Live Dashboards That Update With Your Data',
            description: 'Every query becomes a reusable dashboard widget. Share reports with your team, export to Excel, or embed visualizations. Your single source of truth, always up to date.'
        }
    ]

    const stats = [
        { value: '10x', label: 'Faster Insights', subtext: 'From data upload to visualization in minutes, not days. No data team required.' },
        { value: '0', label: 'SQL Knowledge Needed', subtext: 'Ask questions in plain English. AI translates to queries and shows results instantly.' },
        { value: '100%', label: 'Team Collaboration', subtext: 'Workspace-based architecture. Every member sees the same data in real-time.' },
        { value: 'Full', label: 'Data Control', subtext: 'Build custom tables from scratch. Your data model, your rules—no rigid templates.' }
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
                        <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors duration-300 text-sm font-medium">What You Can Do</a>
                        <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors duration-300 text-sm font-medium">How It Works</a>
                        <a href="#screenshots" className="text-gray-600 hover:text-gray-900 transition-colors duration-300 text-sm font-medium">Product</a>
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

                {/* Floating Gradient Orbs with Parallax Effect */}
                <FloatingGradientOrb
                    size={600}
                    parallaxStrength={0.08}
                    animationDuration={10}
                    blur={140}
                    opacity={0.35}
                    colors={['#3b82f6', '#8b5cf6', '#ec4899']}
                    className="top-20 left-1/4 -translate-x-1/2 -z-10"
                />
                <FloatingGradientOrb
                    size={500}
                    parallaxStrength={0.06}
                    animationDuration={12}
                    blur={120}
                    opacity={0.3}
                    colors={['#8b5cf6', '#ec4899', '#f59e0b']}
                    className="top-40 right-1/4 translate-x-1/2 -z-10"
                />
                <FloatingGradientOrb
                    size={400}
                    parallaxStrength={0.04}
                    animationDuration={15}
                    blur={100}
                    opacity={0.25}
                    colors={['#10b981', '#3b82f6', '#8b5cf6']}
                    className="bottom-20 left-1/3 -translate-x-1/2 -z-10"
                />

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
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
                        For teams who need to build, analyze, and share data insights—without writing a single line of SQL or code.
                    </p>
                    <p className="text-lg text-gray-500 max-w-3xl mx-auto mb-10">
                        Create custom data models, collaborate in shared workspaces, and let AI answer your business questions in seconds. Perfect for operations teams, analysts, and founders who want data autonomy.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <button
                            onClick={onGetStarted}
                            className="group bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 hover:scale-105 flex items-center gap-2"
                        >
                            Start Building for Free
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </button>
                        <a
                            href="#how-it-works"
                            className="group text-gray-600 hover:text-gray-900 px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 flex items-center gap-2"
                        >
                            See How It Works
                            <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform duration-300" />
                        </a>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto mb-20">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="text-center group">
                                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{stat.value}</div>
                                <div className="text-sm font-medium text-gray-700 mb-2">{stat.label}</div>
                                <div className="text-xs text-gray-500 leading-relaxed max-w-[200px] mx-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    {stat.subtext}
                                </div>
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
                            Everything You Need to Go from Data to Decisions
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Build, analyze, and collaborate—all in one platform designed for non-technical users
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
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

            {/* How It Works Section */}
            <section id="how-it-works" className="py-24 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            From Zero to Insights in 3 Simple Steps
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            No technical expertise required. Start analyzing data in minutes.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                                1
                            </div>
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Database className="w-6 h-6 text-gray-700" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Create Your Workspace</h3>
                            <p className="text-gray-600">
                                Sign up in seconds. Create your first workspace. It's your private data environment—invite your team or work solo.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                                2
                            </div>
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Table2 className="w-6 h-6 text-gray-700" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Build or Upload Your Data</h3>
                            <p className="text-gray-600">
                                Upload CSV/Excel files or build tables from scratch. Define columns, add rows, edit anytime. No schemas, no migrations—just clean, structured data.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                                3
                            </div>
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-6 h-6 text-gray-700" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Ask & Analyze</h3>
                            <p className="text-gray-600">
                                Type questions in plain English. AI handles the heavy lifting—queries, charts, KPIs appear instantly. Save dashboards, share with teammates, export results.
                            </p>
                        </div>
                    </div>

                    <div className="text-center mt-12">
                        <button
                            onClick={onGetStarted}
                            className="group bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 hover:scale-105 inline-flex items-center gap-2"
                        >
                            Ready to Try It?
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </button>
                        <p className="text-gray-500 mt-4 text-sm">
                            No credit card required • 5-minute setup • Free workspace forever
                        </p>
                    </div>
                </div>
            </section>

            {/* Screenshots Section */}
            <section id="screenshots" className="py-24 px-6 bg-gray-50 relative overflow-hidden">
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
                    <div
                        className="relative max-w-5xl mx-auto"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                    >
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-10"></div>

                        {/* Navigation Arrows */}
                        <button
                            onClick={() => setActiveScreenshot(prev => prev === 0 ? 2 : prev - 1)}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors group"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                        </button>
                        <button
                            onClick={() => setActiveScreenshot(prev => (prev + 1) % 3)}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors group"
                        >
                            <ChevronRightIcon className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                        </button>

                        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 transition-all duration-500">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        {screenshots[activeScreenshot].title}
                                    </h3>
                                    <p className="text-gray-600 mt-1">
                                        {screenshots[activeScreenshot].description}
                                    </p>
                                </div>
                                {/* Progress dots */}
                                <div className="flex gap-2">
                                    {screenshots.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveScreenshot(idx)}
                                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${activeScreenshot === idx
                                                    ? 'bg-blue-500 w-6'
                                                    : 'bg-gray-300 hover:bg-gray-400'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="aspect-[16/10] bg-gray-50 overflow-hidden">
                                <img
                                    key={activeScreenshot}
                                    src={screenshots[activeScreenshot].placeholder}
                                    alt={screenshots[activeScreenshot].title}
                                    className="w-full h-full object-cover object-top animate-fadeIn"
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

            {/* Trust & Credibility Section */}
            <section className="py-24 px-6 bg-white border-t border-gray-100">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Built for Real-World Data Challenges
                        </h2>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Quanty.studio started as a graduation project to solve a simple problem: giving non-technical teams the power to work with data like engineers do—without the complexity.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        {/* Trust Element 1 */}
                        <div className="text-center p-6 bg-gray-50 rounded-xl">
                            <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Early Access Program</h3>
                            <p className="text-sm text-gray-600">
                                Join our community of early adopters shaping the future of no-code data analysis
                            </p>
                        </div>

                        {/* Trust Element 2 */}
                        <div className="text-center p-6 bg-gray-50 rounded-xl">
                            <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Data Privacy First</h3>
                            <p className="text-sm text-gray-600">
                                Multi-tenant architecture with workspace-level isolation. Your data never mixes with others
                            </p>
                        </div>

                        {/* Trust Element 3 */}
                        <div className="text-center p-6 bg-gray-50 rounded-xl">
                            <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">No Credit Card to Start</h3>
                            <p className="text-sm text-gray-600">
                                Free tier includes unlimited workspaces, sample data, and full AI access. Upgrade only when you scale
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                        <p className="text-gray-700 leading-relaxed mb-4">
                            <strong>Who's using Quanty today?</strong> Startups tracking metrics without hiring a data team · Operations teams managing internal databases · Analysts who want flexibility without IT bottlenecks
                        </p>
                        <div className="flex flex-wrap justify-center gap-3 text-sm">
                            <span className="px-4 py-2 bg-white rounded-full text-gray-600 border border-gray-200">
                                ✓ No credit card required
                            </span>
                            <span className="px-4 py-2 bg-white rounded-full text-gray-600 border border-gray-200">
                                ✓ 5-minute setup
                            </span>
                            <span className="px-4 py-2 bg-white rounded-full text-gray-600 border border-gray-200">
                                ✓ Free workspace forever
                            </span>
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
                        Stop Waiting for Data Teams. Start Building Today.
                    </h2>
                    <p className="text-xl text-gray-400 mb-10 max-w-3xl mx-auto">
                        Create custom data models, collaborate with your team, and get AI-powered insights—all in one platform designed for non-technical users.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={onGetStarted}
                            className="group bg-white hover:bg-gray-100 text-gray-900 px-10 py-5 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105 inline-flex items-center gap-3"
                        >
                            Start Building for Free
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </button>
                    </div>
                    <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-gray-400">
                        <span>✓ No credit card required</span>
                        <span>✓ 5-minute setup</span>
                        <span>✓ Free workspace forever</span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-gray-100 bg-gray-50">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <div className="flex items-center gap-3">
                            <img src="/quantyblack.png" alt="Quanty" className="h-5 w-auto" />
                            <span className="text-gray-500 text-sm">© 2025 Quanty. All rights reserved.</span>
                        </div>
                        <p className="text-xs text-gray-400">Made for teams who want data freedom</p>
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
