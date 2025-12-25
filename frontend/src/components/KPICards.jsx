import { DollarSign, TrendingUp, Package, Grid, Calendar, Percent, Tag, BarChart3, ArrowUp, ArrowDown } from 'lucide-react'

const KPI_CONFIG = {
  toplam_gelir: { icon: DollarSign, color: 'blue', label: 'Total Revenue' },
  ortalama_satis: { icon: TrendingUp, color: 'green', label: 'Average Sales' },
  toplam_adet: { icon: Package, color: 'purple', label: 'Total Quantity' },
  kategori_sayisi: { icon: Grid, color: 'orange', label: 'Category Count' },
  tarih_araligi: { icon: Calendar, color: 'blue', label: 'Date Range' },
  buyume_orani: { icon: Percent, color: 'green', label: 'Growth Rate' },
  ortalama_fiyat: { icon: Tag, color: 'purple', label: 'Average Price' },
  toplam_urun_cesidi: { icon: BarChart3, color: 'orange', label: 'Product Variety' },
  en_yuksek_satis: { icon: ArrowUp, color: 'green', label: 'Highest Sales' },
  en_dusuk_satis: { icon: ArrowDown, color: 'orange', label: 'Lowest Sales' },
  toplam_kayit: { icon: Package, color: 'blue', label: 'Total Records' },
  // English keys
  total_revenue: { icon: DollarSign, color: 'blue', label: 'Total Revenue' },
  average_sales: { icon: TrendingUp, color: 'green', label: 'Average Sales' },
  total_quantity: { icon: Package, color: 'purple', label: 'Total Quantity' },
  category_count: { icon: Grid, color: 'orange', label: 'Category Count' },
  date_range: { icon: Calendar, color: 'blue', label: 'Date Range' },
  growth_rate: { icon: Percent, color: 'green', label: 'Growth Rate' },
  average_price: { icon: Tag, color: 'purple', label: 'Average Price' },
  product_variety: { icon: BarChart3, color: 'orange', label: 'Product Variety' },
  highest_sales: { icon: ArrowUp, color: 'green', label: 'Highest Sales' },
  lowest_sales: { icon: ArrowDown, color: 'orange', label: 'Lowest Sales' },
  total_records: { icon: Package, color: 'blue', label: 'Total Records' },
}

const ICON_COLORS = {
  blue: 'bg-gray-100 text-gray-600',
  green: 'bg-gray-100 text-gray-600',
  purple: 'bg-gray-100 text-gray-600',
  orange: 'bg-gray-100 text-gray-600',
}

function formatKPIValue(key, value) {
  if (typeof value === 'number') {
    if (key.includes('gelir') || key.includes('fiyat') || key.includes('satis') ||
      key.includes('revenue') || key.includes('price') || key.includes('sales')) {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    if (key.includes('buyume') || key.includes('growth') || key.includes('rate')) {
      return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
    }
    return value.toLocaleString('en-US')
  }
  return value
}

export default function KPICards({ kpis }) {
  const kpiEntries = Object.entries(kpis)
  const colors = ['blue', 'green', 'purple', 'orange']

  if (kpiEntries.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiEntries.map(([key, value], idx) => {
        const config = KPI_CONFIG[key] || { icon: BarChart3, color: colors[idx % 4], label: key }
        const Icon = config.icon
        const colorClass = ICON_COLORS[config.color]
        const formattedValue = formatKPIValue(key, value)
        const isGrowth = key.includes('buyume') || key.includes('growth')
        const isPositive = isGrowth && typeof value === 'number' && value > 0
        const isNegative = isGrowth && typeof value === 'number' && value < 0

        return (
          <div key={key} className="card p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center`}>
                <Icon className="w-6 h-6" />
              </div>
              {isGrowth && (
                <span className={`badge bg-gray-200 text-gray-700`}>
                  {isPositive ? '↑' : isNegative ? '↓' : '–'}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">{config.label}</p>
              <p className={`text-2xl font-bold ${isPositive ? 'text-gray-800' :
                isNegative ? 'text-gray-800' :
                  'text-gray-800'
                }`}>
                {formattedValue}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
