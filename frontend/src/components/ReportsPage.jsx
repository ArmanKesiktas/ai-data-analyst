import { useState, useEffect, useCallback, useRef } from 'react'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
    ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    RadialBarChart, RadialBar, Treemap,
    Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ZAxis
} from 'recharts'
import { Sparkles, Loader2, Calendar, Filter, RefreshCw, Download, Move, Lock, Unlock, GripVertical, Settings, Trash2, FileDown, Palette, Plus, FileBarChart2, LayoutDashboard, LayoutTemplate, Share2 } from 'lucide-react'
import axios from 'axios'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { saveAs } from 'file-saver'
import TemplateSelector from './TemplateSelector'
import ShareModal from './ShareModal'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']
const COLOR_NAMES = ['blue', 'green', 'orange', 'red', 'purple', 'cyan', 'pink', 'lime']
const COLOR_LABELS = ['Blue', 'Green', 'Orange', 'Red', 'Purple', 'Cyan', 'Pink', 'Lime']

// Widget Renderer
function WidgetRenderer({ widget, data }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No data found
            </div>
        )
    }

    const { type, x_axis, y_axis, color = 'blue' } = widget
    const chartColor = COLORS[['blue', 'green', 'orange', 'red', 'purple', 'cyan', 'pink', 'lime'].indexOf(color)] || COLORS[0]

    switch (type) {
        case 'kpi':
            const kpiValue = data[0] ? Object.values(data[0])[0] : 0
            const formattedValue = typeof kpiValue === 'number'
                ? kpiValue.toLocaleString('tr-TR', { maximumFractionDigits: 2 })
                : kpiValue
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-3xl font-bold" style={{ color: chartColor }}>{formattedValue}</p>
                    <p className="text-xs text-gray-400 mt-1">{widget.title}</p>
                </div>
            )

        case 'bar_chart':
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey={x_axis} stroke="#94a3b8" fontSize={10} tickLine={false} angle={-45} textAnchor="end" height={60} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} width={50} />
                        <Tooltip />
                        <Bar dataKey={y_axis} fill={chartColor} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            )

        case 'line_chart':
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey={x_axis} stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} width={50} />
                        <Tooltip />
                        <Line type="monotone" dataKey={y_axis} stroke={chartColor} strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            )

        case 'area_chart':
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                        <defs>
                            <linearGradient id={`gradient-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey={x_axis} stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} width={50} />
                        <Tooltip />
                        <Area type="monotone" dataKey={y_axis} stroke={chartColor} fill={`url(#gradient-${widget.id})`} />
                    </AreaChart>
                </ResponsiveContainer>
            )

        case 'pie_chart':
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data.slice(0, 8)}
                            dataKey={y_axis}
                            nameKey={x_axis}
                            cx="50%"
                            cy="50%"
                            innerRadius="30%"
                            outerRadius="60%"
                            paddingAngle={2}
                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                        >
                            {data.slice(0, 8).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                </ResponsiveContainer>
            )

        case 'table':
            const columns = data.length > 0 ? Object.keys(data[0]) : []
            return (
                <div className="overflow-auto h-full">
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                {columns.map(col => (
                                    <th key={col} className="px-2 py-1.5 text-left font-medium text-gray-500">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.slice(0, 15).map((row, idx) => (
                                <tr key={idx}>
                                    {columns.map(col => (
                                        <td key={col} className="px-2 py-1.5 text-gray-700">
                                            {typeof row[col] === 'number' ? row[col].toLocaleString('tr-TR') : row[col]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )

        // NEW CHART TYPES
        case 'scatter_chart':
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey={x_axis} name={x_axis} stroke="#94a3b8" fontSize={10} />
                        <YAxis dataKey={y_axis} name={y_axis} stroke="#94a3b8" fontSize={10} />
                        <ZAxis range={[50, 200]} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name={widget.title} data={data} fill={chartColor} />
                    </ScatterChart>
                </ResponsiveContainer>
            )

        case 'radar_chart':
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.slice(0, 8)}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey={x_axis} fontSize={10} stroke="#94a3b8" />
                        <PolarRadiusAxis fontSize={9} stroke="#94a3b8" />
                        <Radar name={y_axis} dataKey={y_axis} stroke={chartColor} fill={chartColor} fillOpacity={0.4} />
                        <Tooltip />
                    </RadarChart>
                </ResponsiveContainer>
            )

        case 'gauge_chart':
            const gaugeValue = data[0] ? Object.values(data[0])[0] : 0
            const maxValue = Math.max(...data.map(d => Object.values(d)[0] || 0)) * 1.2 || 100
            const gaugeData = [{ name: widget.title, value: gaugeValue, fill: chartColor }]
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="90%"
                        barSize={15}
                        data={gaugeData}
                        startAngle={180}
                        endAngle={0}
                    >
                        <RadialBar background clockWise dataKey="value" cornerRadius={10} />
                        <Tooltip />
                        <text x="50%" y="55%" textAnchor="middle" fill={chartColor} fontSize={24} fontWeight="bold">
                            {typeof gaugeValue === 'number' ? gaugeValue.toLocaleString('tr-TR') : gaugeValue}
                        </text>
                        <text x="50%" y="70%" textAnchor="middle" fill="#94a3b8" fontSize={11}>
                            {widget.title}
                        </text>
                    </RadialBarChart>
                </ResponsiveContainer>
            )

        case 'treemap_chart':
            const treemapData = data.slice(0, 12).map((item, index) => ({
                name: item[x_axis] || `Item ${index + 1}`,
                size: item[y_axis] || 0,
                fill: COLORS[index % COLORS.length]
            }))
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                        data={treemapData}
                        dataKey="size"
                        aspectRatio={4 / 3}
                        stroke="#fff"
                        content={({ root, depth, x, y, width, height, index, name, value }) => (
                            <g>
                                <rect
                                    x={x}
                                    y={y}
                                    width={width}
                                    height={height}
                                    style={{
                                        fill: COLORS[index % COLORS.length],
                                        stroke: '#fff',
                                        strokeWidth: 2,
                                        strokeOpacity: 1,
                                    }}
                                />
                                {width > 50 && height > 25 && (
                                    <text
                                        x={x + width / 2}
                                        y={y + height / 2}
                                        textAnchor="middle"
                                        fill="#fff"
                                        fontSize={11}
                                        fontWeight="500"
                                    >
                                        {name}
                                    </text>
                                )}
                            </g>
                        )}
                    />
                </ResponsiveContainer>
            )

        default:
            return <div className="text-gray-400 text-center text-sm">Bilinmeyen widget</div>
    }
}

// Dashboard Filter Component - Enhanced
function DashboardFilter({ filter, value, onChange }) {
    const { type, label, column } = filter

    // Quick date presets
    const getDatePreset = (preset) => {
        const today = new Date()
        const formatDate = (d) => d.toISOString().split('T')[0]

        switch (preset) {
            case 'today':
                return { start: formatDate(today), end: formatDate(today) }
            case 'week':
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                return { start: formatDate(weekAgo), end: formatDate(today) }
            case 'month':
                const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
                return { start: formatDate(monthAgo), end: formatDate(today) }
            case 'year':
                const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)
                return { start: formatDate(yearAgo), end: formatDate(today) }
            default:
                return { start: '', end: '' }
        }
    }

    switch (type) {
        case 'date_range':
            return (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-medium text-gray-600">{label}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Quick presets */}
                        <div className="flex gap-1">
                            {[
                                { key: 'today', label: 'Today' },
                                { key: 'week', label: '7 Days' },
                                { key: 'month', label: '30 Days' },
                                { key: 'year', label: 'Year' }
                            ].map(preset => (
                                <button
                                    key={preset.key}
                                    onClick={() => onChange(getDatePreset(preset.key))}
                                    className="px-2 py-1 text-xs rounded-md bg-gray-100 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                        {/* Custom range */}
                        <div className="flex items-center gap-1">
                            <input
                                type="date"
                                value={value?.start || ''}
                                className="px-2 py-1 border border-gray-200 rounded-md text-xs focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
                                onChange={(e) => onChange({ ...value, start: e.target.value })}
                            />
                            <span className="text-gray-400 text-xs">→</span>
                            <input
                                type="date"
                                value={value?.end || ''}
                                className="px-2 py-1 border border-gray-200 rounded-md text-xs focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
                                onChange={(e) => onChange({ ...value, end: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            )

        case 'select':
        case 'multi_select':
            const filterOptions = filter.options || []
            return (
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-600">{label}:</span>
                    <select
                        className="px-3 py-1.5 border border-gray-200 rounded-md text-xs min-w-[140px] bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none cursor-pointer"
                        onChange={(e) => onChange(e.target.value)}
                        value={value || ''}
                    >
                        <option value="">All {label}</option>
                        {filterOptions.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            )

        case 'number_range':
            return (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">{label}:</span>
                    <input
                        type="number"
                        placeholder="Min"
                        value={value?.min || ''}
                        className="w-20 px-2 py-1 border border-gray-200 rounded-md text-xs focus:border-blue-400 outline-none"
                        onChange={(e) => onChange({ ...value, min: e.target.value })}
                    />
                    <span className="text-gray-400 text-xs">-</span>
                    <input
                        type="number"
                        placeholder="Max"
                        value={value?.max || ''}
                        className="w-20 px-2 py-1 border border-gray-200 rounded-md text-xs focus:border-blue-400 outline-none"
                        onChange={(e) => onChange({ ...value, max: e.target.value })}
                    />
                </div>
            )

        case 'search':
            return (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">{label}:</span>
                    <input
                        type="text"
                        placeholder={`Search ${label}...`}
                        value={value || ''}
                        className="px-3 py-1.5 border border-gray-200 rounded-md text-xs min-w-[160px] focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
                        onChange={(e) => onChange(e.target.value)}
                    />
                </div>
            )

        default:
            return null
    }
}

export default function ReportsPage({ activeTable, tables }) {
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [dashboard, setDashboard] = useState(null)
    const [widgetData, setWidgetData] = useState({})
    const [error, setError] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [layouts, setLayouts] = useState([])
    const [filterValues, setFilterValues] = useState({})
    const [gridWidth, setGridWidth] = useState(900)
    const [savedDashboards, setSavedDashboards] = useState([])
    const [showCreator, setShowCreator] = useState(true)
    const [showTemplates, setShowTemplates] = useState(false)
    const [showShare, setShowShare] = useState(false)

    const dashboardRef = useRef(null)
    const containerRef = useRef(null)

    const currentTable = tables.find(t => t.name === activeTable)

    // Load saved dashboards from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('savedDashboards')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                setSavedDashboards(parsed)
                // Don't auto-load the last dashboard, show the creator instead
                // Users can manually load a dashboard from the list
            } catch (e) {
                console.error('Error loading saved dashboards:', e)
            }
        }
    }, [])

    // Save dashboard to localStorage
    const saveDashboardToStorage = (newDashboard) => {
        const dashboardToSave = {
            ...newDashboard,
            id: Date.now(),
            createdAt: new Date().toISOString(),
            tableName: activeTable
        }
        const updated = [...savedDashboards, dashboardToSave]
        setSavedDashboards(updated)
        localStorage.setItem('savedDashboards', JSON.stringify(updated))
        return dashboardToSave
    }

    // Load a dashboard from saved list
    const loadDashboard = async (savedDashboard) => {
        setDashboard(savedDashboard)
        setLayouts(getLayoutFromWidgets(savedDashboard.widgets))
        setShowCreator(false)
        setDescription('')

        // Refresh widget data
        try {
            const widgetsFormData = new FormData()
            widgetsFormData.append('widgets', JSON.stringify(savedDashboard.widgets))
            const widgetsRes = await axios.post(`${API_URL}/api/dashboard/execute-all`, widgetsFormData)
            if (widgetsRes.data.success) {
                setWidgetData(widgetsRes.data.results)
            }
        } catch (err) {
            console.error('Error loading widget data:', err)
        }
    }

    // Delete a saved dashboard
    const deleteSavedDashboard = (id) => {
        const updated = savedDashboards.filter(d => d.id !== id)
        setSavedDashboards(updated)
        localStorage.setItem('savedDashboards', JSON.stringify(updated))

        // If we deleted the current dashboard, show creator
        if (dashboard?.id === id) {
            setDashboard(null)
            setWidgetData({})
            setShowCreator(true)
        }
    }

    // Handle new dashboard button click
    const handleNewDashboard = () => {
        setShowCreator(true)
        setDescription('')
    }

    // Handle template selection
    const handleTemplateSelect = (template) => {
        // Create a description from the template for AI to use
        const templateDescription = `Create a ${template.name.toLowerCase()} with: ${template.widgets.map(w => w.title).join(', ')}`
        setDescription(templateDescription)
        setShowTemplates(false)
        // Auto-generate dashboard based on template description
        generateDashboard(templateDescription)
    }

    // Dinamik genişlik hesaplama
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                // Get the actual content width minus padding (24px = 12px each side from p-3)
                const width = containerRef.current.getBoundingClientRect().width - 24
                setGridWidth(Math.max(width, 600))
            }
        }
        // Initial calculation after a short delay for DOM to settle
        const timeout = setTimeout(updateWidth, 100)
        window.addEventListener('resize', updateWidth)
        return () => {
            clearTimeout(timeout)
            window.removeEventListener('resize', updateWidth)
        }
    }, [dashboard])

    // Layout değişikliklerini kaydet
    const onLayoutChange = useCallback((newLayout) => {
        if (isEditing) {
            setLayouts(newLayout)
        }
    }, [isEditing])

    // Widget'ları layout'a dönüştür - tam genişliğe yay
    const getLayoutFromWidgets = (widgets) => {
        // Önce KPI'ları, sonra grafikleri yerleştir
        const kpis = widgets.filter(w => w.type === 'kpi')
        const charts = widgets.filter(w => w.type !== 'kpi' && w.type !== 'table')
        const tables = widgets.filter(w => w.type === 'table')

        const layout = []
        let currentY = 0

        // KPI kartlarını yan yana yerleştir - 12'ye böl
        if (kpis.length > 0) {
            const kpiWidth = Math.floor(12 / Math.min(kpis.length, 4))
            kpis.forEach((widget, idx) => {
                layout.push({
                    i: widget.id,
                    x: (idx % 4) * kpiWidth,
                    y: currentY + Math.floor(idx / 4),
                    w: kpiWidth,
                    h: 1,
                    minW: 2,
                    minH: 1,
                    maxW: 12,
                    maxH: 2
                })
            })
            currentY += Math.ceil(kpis.length / 4)
        }

        // Grafikleri ikişerli yerleştir
        charts.forEach((widget, idx) => {
            layout.push({
                i: widget.id,
                x: (idx % 2) * 6,
                y: currentY + Math.floor(idx / 2) * 2,
                w: 6,
                h: 2,
                minW: 3,
                minH: 1,
                maxW: 12,
                maxH: 4
            })
        })
        if (charts.length > 0) {
            currentY += Math.ceil(charts.length / 2) * 2
        }

        // Tabloları tam genişlikte yerleştir
        tables.forEach((widget, idx) => {
            layout.push({
                i: widget.id,
                x: 0,
                y: currentY + idx * 2,
                w: 12,
                h: 2,
                minW: 6,
                minH: 2,
                maxW: 12,
                maxH: 6
            })
        })

        return layout
    }

    const generateDashboard = async () => {
        if (!description.trim() || !activeTable) return

        setLoading(true)
        setError(null)
        setDashboard(null)
        setWidgetData({})
        setShowCreator(false) // Hide creator during loading

        try {
            const formData = new FormData()
            formData.append('description', description)
            formData.append('table_name', activeTable)

            const res = await axios.post(`${API_URL}/api/dashboard/generate`, formData)

            if (res.data.success) {
                const dashboardConfig = res.data.dashboard

                // Save to localStorage with metadata
                const savedConfig = saveDashboardToStorage({
                    ...dashboardConfig,
                    description: description
                })

                setDashboard(savedConfig)
                setLayouts(getLayoutFromWidgets(savedConfig.widgets))

                // Fetch widget data
                const widgetsFormData = new FormData()
                widgetsFormData.append('widgets', JSON.stringify(savedConfig.widgets))

                const widgetsRes = await axios.post(`${API_URL}/api/dashboard/execute-all`, widgetsFormData)

                if (widgetsRes.data.success) {
                    setWidgetData(widgetsRes.data.results)
                }

                setDescription('') // Clear description after successful creation
            }
        } catch (err) {
            console.error('Dashboard error:', err)
            setError(err.response?.data?.detail || 'Could not create dashboard')
            setShowCreator(true) // Show creator again on error
        } finally {
            setLoading(false)
        }
    }

    // SQL'e filtre koşullarını ekle
    const applyFiltersToSQL = (sql, filters, filterVals) => {
        if (!filters || filters.length === 0) return sql

        // Aktif filtreler (değeri olan)
        const activeFilters = filters.filter(f => {
            const val = filterVals[f.id]
            if (!val) return false
            if (f.type === 'date_range') {
                return val.start || val.end
            }
            return val !== ''
        })

        if (activeFilters.length === 0) return sql

        // WHERE veya GROUP BY öncesine filtre ekle
        let modifiedSQL = sql
        const whereConditions = []

        activeFilters.forEach(filter => {
            const val = filterVals[filter.id]
            const colName = filter.column

            if (filter.type === 'date_range') {
                if (val.start) {
                    whereConditions.push(`${colName} >= '${val.start}'`)
                }
                if (val.end) {
                    whereConditions.push(`${colName} <= '${val.end}'`)
                }
            } else if (filter.type === 'select' || filter.type === 'multi_select') {
                whereConditions.push(`${colName} = '${val}'`)
            }
        })

        if (whereConditions.length === 0) return sql

        // WHERE ekle veya AND ile birleştir
        const filterClause = whereConditions.join(' AND ')

        // SQL'de WHERE var mı kontrol et
        const whereMatch = modifiedSQL.match(/\bWHERE\b/i)
        const groupMatch = modifiedSQL.match(/\bGROUP\s+BY\b/i)
        const orderMatch = modifiedSQL.match(/\bORDER\s+BY\b/i)
        const limitMatch = modifiedSQL.match(/\bLIMIT\b/i)

        if (whereMatch) {
            // Mevcut WHERE'e AND ile ekle
            const whereIdx = whereMatch.index + 5
            modifiedSQL = modifiedSQL.slice(0, whereIdx) + ` (${filterClause}) AND` + modifiedSQL.slice(whereIdx)
        } else {
            // FROM'dan sonra WHERE ekle
            let insertPos = null
            if (groupMatch) insertPos = groupMatch.index
            else if (orderMatch) insertPos = orderMatch.index
            else if (limitMatch) insertPos = limitMatch.index
            else insertPos = modifiedSQL.lastIndexOf(';')

            if (insertPos > 0) {
                modifiedSQL = modifiedSQL.slice(0, insertPos) + ` WHERE ${filterClause} ` + modifiedSQL.slice(insertPos)
            }
        }

        console.log('🔍 Filtrelenmiş SQL:', modifiedSQL.substring(0, 150) + '...')
        return modifiedSQL
    }

    const refreshWidget = async (widget, useFilters = false) => {
        try {
            let sql = widget.sql

            // Filtre uygula
            if (useFilters && dashboard?.filters) {
                sql = applyFiltersToSQL(sql, dashboard.filters, filterValues)
            }

            const formData = new FormData()
            formData.append('sql', sql)
            formData.append('widget_id', widget.id)

            const res = await axios.post(`${API_URL}/api/dashboard/execute-widget`, formData)

            if (res.data.success) {
                setWidgetData(prev => ({
                    ...prev,
                    [widget.id]: res.data
                }))
            }
        } catch (err) {
            console.error('Widget yenileme hatası:', err)
        }
    }

    // Filtre değiştiğinde tüm widget'ları yeniden sorgula
    const prevFilterRef = useRef(null)

    useEffect(() => {
        if (!dashboard?.widgets || dashboard.widgets.length === 0) return

        // İlk yükleme mi kontrol et
        const isFirstLoad = prevFilterRef.current === null

        // Aktif filtre var mı?
        const hasActiveFilter = Object.values(filterValues).some(v => v && (typeof v !== 'object' || v.start || v.end))

        // Önceki durumda aktif filtre var mıydı?
        const hadActiveFilter = prevFilterRef.current && Object.values(prevFilterRef.current).some(v => v && (typeof v !== 'object' || v.start || v.end))

        // Referansı güncelle
        prevFilterRef.current = { ...filterValues }

        // İlk yüklemede atlıyoruz
        if (isFirstLoad) return

        // Filtre değişti mi? (aktiften pasife veya pasiften aktife veya değer değişti)
        console.log('🔄 Filtreler değişti:', filterValues, 'Aktif:', hasActiveFilter, 'Önceki aktif:', hadActiveFilter)

        // Tüm widget'ları yenile
        // hasActiveFilter true ise filtreli, false ise filtresiz (orijinal SQL)
        dashboard.widgets.forEach(widget => {
            refreshWidget(widget, hasActiveFilter)
        })
    }, [filterValues])

    const deleteWidget = (widgetId) => {
        if (!dashboard) return
        const updatedWidgets = dashboard.widgets.filter(w => w.id !== widgetId)
        setDashboard(prev => ({ ...prev, widgets: updatedWidgets }))
    }

    // Widget color change
    const changeWidgetColor = (widgetId, newColor) => {
        if (!dashboard) return
        const updatedWidgets = dashboard.widgets.map(w =>
            w.id === widgetId ? { ...w, color: newColor } : w
        )
        setDashboard(prev => ({ ...prev, widgets: updatedWidgets }))
    }

    // Widget title rename
    const renameWidget = (widgetId, newTitle) => {
        if (!dashboard) return
        const updatedWidgets = dashboard.widgets.map(w =>
            w.id === widgetId ? { ...w, title: newTitle } : w
        )
        setDashboard(prev => ({ ...prev, widgets: updatedWidgets }))
    }

    // PDF Export
    const exportToPDF = async () => {
        console.log('📥 PDF export başlıyor...')
        console.log('   dashboardRef:', dashboardRef.current)
        console.log('   dashboard:', dashboard?.title)

        if (!dashboardRef.current || !dashboard) {
            console.error('❌ Dashboard ref veya dashboard yok!')
            alert('Dashboard not found. Please create a dashboard first.')
            return
        }

        setExporting(true)

        try {
            // Düzenleme modunu geçici olarak kapat
            const wasEditing = isEditing
            setIsEditing(false)

            console.log('   ⏳ 500ms bekleniyor...')
            await new Promise(resolve => setTimeout(resolve, 500))

            console.log('   📸 html2canvas başlıyor...')
            const canvas = await html2canvas(dashboardRef.current, {
                scale: 2,
                useCORS: true,
                logging: true,
                backgroundColor: '#f0f5ff',
                allowTaint: true,
                foreignObjectRendering: false
            })
            console.log('   ✅ Canvas oluşturuldu:', canvas.width, 'x', canvas.height)

            const imgData = canvas.toDataURL('image/png')
            console.log('   📄 Image data uzunluğu:', imgData.length)

            const pdf = new jsPDF({
                orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            })
            console.log('   📄 PDF oluşturuldu')

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)

            // Dosya adı - Türkçe karakterleri temizle
            const cleanTitle = (dashboard.title || 'dashboard')
                .replace(/ş/g, 's').replace(/Ş/g, 'S')
                .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
                .replace(/ü/g, 'u').replace(/Ü/g, 'U')
                .replace(/ö/g, 'o').replace(/Ö/g, 'O')
                .replace(/ç/g, 'c').replace(/Ç/g, 'C')
                .replace(/ı/g, 'i').replace(/İ/g, 'I')
                .replace(/[^a-zA-Z0-9\s_-]/g, '')
                .trim()
            const filename = `${cleanTitle}_${new Date().toISOString().split('T')[0]}.pdf`
            console.log('   💾 Kaydediliyor:', filename)

            // file-saver ile kaydet (dosya adı düzgün olur)
            const pdfBlob = pdf.output('blob')
            saveAs(pdfBlob, filename)

            console.log('   ✅ PDF kaydedildi!')

            if (wasEditing) setIsEditing(true)

        } catch (err) {
            console.error('❌ PDF export hatası:', err)
            alert(`Error creating PDF: ${err.message}`)
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
            {/* Header - Only show when in creator mode or loading */}
            {(showCreator || loading) && (
                <div className="mb-6 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">AI Dashboard Builder</h1>
                        <p className="text-gray-500 text-sm">Describe your dashboard and AI will create it for you</p>
                    </div>
                </div>
            )}

            {/* Skeleton Loading State */}
            {loading && (
                <div className="flex-1 space-y-4">
                    {/* Skeleton Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="skeleton-shimmer h-6 w-48 rounded mb-2"></div>
                            <div className="skeleton-shimmer h-4 w-72 rounded"></div>
                        </div>
                        <div className="flex gap-2">
                            <div className="skeleton-shimmer h-9 w-20 rounded-lg"></div>
                            <div className="skeleton-shimmer h-9 w-24 rounded-lg"></div>
                        </div>
                    </div>

                    {/* Skeleton Filters */}
                    <div className="card p-3 flex gap-3">
                        <div className="skeleton-shimmer h-8 w-32 rounded-lg"></div>
                        <div className="skeleton-shimmer h-8 w-32 rounded-lg"></div>
                        <div className="skeleton-shimmer h-8 w-32 rounded-lg"></div>
                    </div>

                    {/* Skeleton Grid */}
                    <div className="bg-gray-50 rounded-xl p-4 flex-1">
                        <div className="grid grid-cols-12 gap-3 h-full">
                            {/* 4 KPI Cards */}
                            {[0, 1, 2, 3].map((i) => (
                                <div key={`kpi-${i}`} className="col-span-3 card p-3">
                                    <div className="skeleton-shimmer h-3 w-20 rounded mb-2"></div>
                                    <div className="skeleton-shimmer h-6 w-24 rounded"></div>
                                </div>
                            ))}

                            {/* Chart Placeholders */}
                            <div className="col-span-6 card p-3">
                                <div className="skeleton-shimmer h-3 w-28 rounded mb-2"></div>
                                <div className="skeleton-shimmer h-28 w-full rounded"></div>
                            </div>
                            <div className="col-span-6 card p-3">
                                <div className="skeleton-shimmer h-3 w-24 rounded mb-2"></div>
                                <div className="flex items-center justify-center h-28">
                                    <div className="skeleton-shimmer h-24 w-24 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Dashboard Builder Input - Only show when showCreator is true and not loading */}
            {showCreator && !loading && (
                <>
                    <div className="card p-6 mb-6">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <h2 className="font-semibold text-gray-800 mb-1">Describe Your Dashboard</h2>
                                <p className="text-sm text-gray-500">
                                    {activeTable
                                        ? `What kind of dashboard do you want for "${activeTable}" table?`
                                        : 'Please select a table first'
                                    }
                                </p>
                            </div>
                        </div>

                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Example: Daily sales trend, pie chart by categories, total revenue KPI, top 10 products table..."
                            className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-gray-400 min-h-[60px]"
                            disabled={loading || !activeTable}
                        />

                        <div className="flex items-center justify-between mt-4">
                            <div className="flex flex-wrap gap-1">
                                <span className="text-xs text-gray-400 mr-1">Suggestions:</span>
                                {['Daily trend', 'Category breakdown', 'Top 10', 'KPI summary'].map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setDescription(prev => prev + (prev ? ', ' : '') + suggestion.toLowerCase())}
                                        className="btn-secondary text-xs py-1 px-2"
                                        disabled={loading}
                                    >
                                        + {suggestion}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowTemplates(true)}
                                    disabled={loading || !activeTable}
                                    className="btn-secondary flex items-center gap-2"
                                >
                                    <LayoutTemplate className="w-4 h-4" />
                                    <span>Use Template</span>
                                </button>
                                <button
                                    onClick={generateDashboard}
                                    disabled={loading || !description.trim() || !activeTable}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span>Create Dashboard</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Previous Dashboards List */}
                    {savedDashboards.length > 0 && (
                        <div className="card p-4 mb-6">
                            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <FileBarChart2 className="w-4 h-4" />
                                Previous Dashboards
                            </h3>
                            <div className="space-y-2">
                                {savedDashboards.map((saved) => (
                                    <div
                                        key={saved.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-700 truncate">
                                                {saved.title || saved.description?.substring(0, 50) || 'Untitled Dashboard'}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {saved.tableName} • {new Date(saved.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 ml-3">
                                            <button
                                                onClick={() => loadDashboard(saved)}
                                                className="btn-secondary text-xs py-1 px-2"
                                            >
                                                Load
                                            </button>
                                            <button
                                                onClick={() => deleteSavedDashboard(saved.id)}
                                                className="p-1 hover:bg-gray-200 rounded text-gray-400"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Error */}
            {error && (
                <div className="card p-4 mb-6 bg-gray-50 border-gray-300">
                    <p className="text-gray-600 text-sm">{error}</p>
                </div>
            )}

            {/* Generated Dashboard */}
            {dashboard && !showCreator && !loading && (
                <div className="flex-1 flex flex-col overflow-hidden space-y-3">
                    {/* Dashboard Header */}
                    <div className="flex items-center justify-between flex-shrink-0">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{dashboard.title}</h2>
                            {dashboard.description && (
                                <p className="text-sm text-gray-500">{dashboard.description}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleNewDashboard}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>New</span>
                            </button>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`btn-secondary flex items-center gap-2 ${isEditing ? 'bg-gray-200 text-gray-800 border-gray-400' : ''}`}
                            >
                                {isEditing ? (
                                    <>
                                        <Lock className="w-4 h-4" />
                                        <span>Lock</span>
                                    </>
                                ) : (
                                    <>
                                        <Unlock className="w-4 h-4" />
                                        <span>Edit</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={exportToPDF}
                                disabled={exporting}
                                className="btn-primary flex items-center gap-2"
                            >
                                {exporting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>PDF Oluşturuluyor...</span>
                                    </>
                                ) : (
                                    <>
                                        <FileDown className="w-4 h-4" />
                                        <span>PDF İndir</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setShowShare(true)}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <Share2 className="w-4 h-4" />
                                <span>Share</span>
                            </button>
                        </div>
                    </div>

                    {/* Edit Mode Info */}
                    {isEditing && (
                        <div className="card p-3 bg-gray-100 border-gray-300 flex items-center gap-3">
                            <Move className="w-5 h-5 text-gray-600" />
                            <p className="text-sm text-gray-700">
                                <strong>Edit Mode:</strong> Drag widgets to move, resize from corners. Set your preferred size.
                            </p>
                        </div>
                    )}

                    {/* Filters */}
                    {dashboard.filters && dashboard.filters.length > 0 && (
                        <div className="card p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">Filters</span>
                                    {Object.values(filterValues).some(v => v && (typeof v !== 'object' || v.start || v.end || v.min || v.max)) && (
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full font-medium">
                                            {Object.values(filterValues).filter(v => v && (typeof v !== 'object' || v.start || v.end || v.min || v.max)).length} active
                                        </span>
                                    )}
                                </div>
                                {Object.values(filterValues).some(v => v && (typeof v !== 'object' || v.start || v.end || v.min || v.max)) && (
                                    <button
                                        onClick={() => setFilterValues({})}
                                        className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap items-start gap-4">
                                {dashboard.filters.map((filter, idx) => (
                                    <DashboardFilter
                                        key={idx}
                                        filter={filter}
                                        value={filterValues[filter.id]}
                                        onChange={(val) => setFilterValues(prev => ({ ...prev, [filter.id]: val }))}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Widgets Grid - Full Width */}
                    <div ref={(el) => { dashboardRef.current = el; containerRef.current = el; }} className="bg-[#f0f5ff] rounded-xl p-3 flex-1 overflow-auto w-full">
                        <GridLayout
                            className="layout"
                            layout={layouts}
                            cols={12}
                            rowHeight={70}
                            width={gridWidth}
                            onLayoutChange={onLayoutChange}
                            isDraggable={isEditing}
                            isResizable={isEditing}
                            draggableHandle=".drag-handle"
                            margin={[12, 12]}
                            containerPadding={[0, 0]}
                            useCSSTransforms={true}
                            compactType={null}
                            preventCollision={true}
                        >
                            {dashboard.widgets.map((widget) => {
                                const data = widgetData[widget.id]?.data || []
                                const widgetError = widgetData[widget.id]?.error

                                return (
                                    <div key={widget.id} className="card overflow-hidden shadow-sm">
                                        {/* Widget Header */}
                                        <div className={`flex items-center justify-between px-3 py-2 border-b border-gray-100 ${isEditing ? 'bg-gray-50 cursor-move drag-handle' : ''}`}>
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                {isEditing && (
                                                    <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                )}
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={widget.title}
                                                        onChange={(e) => renameWidget(widget.id, e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="font-medium text-gray-700 text-sm bg-white border border-gray-200 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                    />
                                                ) : (
                                                    <h3 className="font-medium text-gray-700 text-sm truncate">{widget.title}</h3>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {isEditing && (
                                                    <>
                                                        {/* Color Picker */}
                                                        <div className="relative group">
                                                            <button
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                                                title="Change Color"
                                                            >
                                                                <div className="w-4 h-4 rounded-full border-2 border-gray-300" style={{ backgroundColor: COLORS[COLOR_NAMES.indexOf(widget.color)] || COLORS[0] }}></div>
                                                            </button>
                                                            {/* Color Picker Popup */}
                                                            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-3 hidden group-hover:block z-50 min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                                                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                                                                    <Palette className="w-4 h-4 text-gray-400" />
                                                                    <p className="text-xs font-medium text-gray-600">Widget Color</p>
                                                                </div>
                                                                <div className="grid grid-cols-4 gap-2">
                                                                    {COLORS.map((color, idx) => (
                                                                        <button
                                                                            key={idx}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                changeWidgetColor(widget.id, COLOR_NAMES[idx])
                                                                            }}
                                                                            className={`w-7 h-7 rounded-lg transition-all hover:scale-110 hover:shadow-md ${widget.color === COLOR_NAMES[idx] ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:ring-1 hover:ring-gray-200'}`}
                                                                            style={{ backgroundColor: color }}
                                                                            title={COLOR_LABELS[idx]}
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <p className="text-[10px] text-gray-400 mt-2 text-center">{COLOR_LABELS[COLOR_NAMES.indexOf(widget.color)] || 'Mavi'}</p>
                                                            </div>
                                                        </div>
                                                        {/* Silme Butonu */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                deleteWidget(widget.id)
                                                            }}
                                                            className="p-1 hover:bg-red-50 rounded"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                        </button>
                                                    </>
                                                )}
                                                {!isEditing && (
                                                    <button
                                                        onClick={() => refreshWidget(widget)}
                                                        className="p-1 hover:bg-gray-100 rounded"
                                                        title="Yenile"
                                                    >
                                                        <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Widget Content */}
                                        <div className="p-3 h-[calc(100%-40px)]">
                                            {widgetError ? (
                                                <div className="text-red-500 text-xs">{widgetError}</div>
                                            ) : (
                                                <WidgetRenderer widget={widget} data={data} />
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </GridLayout>
                    </div>
                </div>
            )}

            {/* Empty State - white card with message */}
            {!dashboard && !loading && savedDashboards.length === 0 && (
                <div className="card p-8 text-center flex-1 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
                        <LayoutDashboard className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-gray-600 font-medium mb-2">No Dashboards Yet</h3>
                    <p className="text-gray-400 text-sm max-w-sm">
                        Your saved dashboards will appear here. Use the form above to create your first dashboard.
                    </p>
                </div>
            )}

            {/* Template Selector Modal */}
            {showTemplates && (
                <TemplateSelector
                    onSelect={handleTemplateSelect}
                    onClose={() => setShowTemplates(false)}
                />
            )}

            {/* Share Modal */}
            {showShare && (
                <ShareModal
                    dashboard={dashboard}
                    onClose={() => setShowShare(false)}
                />
            )}
        </div>
    )
}
