import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { BarChart3, TrendingUp, PieChartIcon } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
        <p className="text-sm font-medium text-gray-800 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number'
              ? entry.value.toLocaleString('tr-TR')
              : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function ChartDisplay({ data, config }) {
  if (!data || data.length === 0 || !config) {
    return null
  }

  const { type, x_axis, y_axis } = config

  // Format data for charts
  const chartData = data.map(item => ({
    ...item,
    [x_axis]: item[x_axis]?.toString() || '',
    [y_axis]: parseFloat(item[y_axis]) || 0
  }))

  const getChartIcon = () => {
    switch (type) {
      case 'line': return <TrendingUp className="w-5 h-5 text-blue-500" />
      case 'pie': return <PieChartIcon className="w-5 h-5 text-blue-500" />
      default: return <BarChart3 className="w-5 h-5 text-blue-500" />
    }
  }

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey={x_axis}
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toLocaleString('tr-TR')}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey={y_axis}
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey={x_axis}
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toLocaleString('tr-TR')}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={y_axis}
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey={y_axis}
                nameKey={x_axis}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                label={(entry) => entry[x_axis]}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return <p className="text-gray-500">Grafik türü desteklenmiyor: {type}</p>
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getChartIcon()}
          <h3 className="font-semibold text-gray-800">Veri Görselleştirme</h3>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary py-1.5 px-3 text-xs">
            Son 1 Ay
          </button>
        </div>
      </div>
      {renderChart()}
    </div>
  )
}
