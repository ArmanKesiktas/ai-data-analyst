// Dashboard Template Definitions
// Each template contains predefined widgets configuration

export const DASHBOARD_TEMPLATES = [
    {
        id: 'sales',
        name: 'Sales Dashboard',
        description: 'Track revenue, orders, and sales performance',
        icon: '💰',
        color: '#3b82f6',
        widgets: [
            {
                id: 'kpi-1',
                type: 'kpi',
                title: 'Total Revenue',
                config: { metric: 'revenue', format: 'currency' },
                layout: { i: 'kpi-1', x: 0, y: 0, w: 3, h: 2 }
            },
            {
                id: 'kpi-2',
                type: 'kpi',
                title: 'Total Orders',
                config: { metric: 'orders', format: 'number' },
                layout: { i: 'kpi-2', x: 3, y: 0, w: 3, h: 2 }
            },
            {
                id: 'kpi-3',
                type: 'kpi',
                title: 'Average Order Value',
                config: { metric: 'aov', format: 'currency' },
                layout: { i: 'kpi-3', x: 6, y: 0, w: 3, h: 2 }
            },
            {
                id: 'kpi-4',
                type: 'kpi',
                title: 'Conversion Rate',
                config: { metric: 'conversion', format: 'percentage' },
                layout: { i: 'kpi-4', x: 9, y: 0, w: 3, h: 2 }
            },
            {
                id: 'chart-1',
                type: 'line',
                title: 'Revenue Trend',
                config: { xAxis: 'date', yAxis: 'revenue' },
                layout: { i: 'chart-1', x: 0, y: 2, w: 8, h: 4 }
            },
            {
                id: 'chart-2',
                type: 'bar',
                title: 'Sales by Category',
                config: { xAxis: 'category', yAxis: 'quantity' },
                layout: { i: 'chart-2', x: 8, y: 2, w: 4, h: 4 }
            },
            {
                id: 'chart-3',
                type: 'pie',
                title: 'Revenue by Region',
                config: { dimension: 'region', metric: 'revenue' },
                layout: { i: 'chart-3', x: 0, y: 6, w: 4, h: 4 }
            },
            {
                id: 'chart-4',
                type: 'bar',
                title: 'Top Products',
                config: { xAxis: 'product', yAxis: 'revenue' },
                layout: { i: 'chart-4', x: 4, y: 6, w: 8, h: 4 }
            }
        ]
    },
    {
        id: 'marketing',
        name: 'Marketing Dashboard',
        description: 'Monitor campaigns, traffic, and engagement metrics',
        icon: '📈',
        color: '#10b981',
        widgets: [
            {
                id: 'kpi-1',
                type: 'kpi',
                title: 'Total Visitors',
                config: { metric: 'visitors', format: 'number' },
                layout: { i: 'kpi-1', x: 0, y: 0, w: 3, h: 2 }
            },
            {
                id: 'kpi-2',
                type: 'kpi',
                title: 'Conversion Rate',
                config: { metric: 'conversion', format: 'percentage' },
                layout: { i: 'kpi-2', x: 3, y: 0, w: 3, h: 2 }
            },
            {
                id: 'kpi-3',
                type: 'kpi',
                title: 'Bounce Rate',
                config: { metric: 'bounce', format: 'percentage' },
                layout: { i: 'kpi-3', x: 6, y: 0, w: 3, h: 2 }
            },
            {
                id: 'kpi-4',
                type: 'kpi',
                title: 'Avg Session Duration',
                config: { metric: 'duration', format: 'time' },
                layout: { i: 'kpi-4', x: 9, y: 0, w: 3, h: 2 }
            },
            {
                id: 'chart-1',
                type: 'area',
                title: 'Traffic Over Time',
                config: { xAxis: 'date', yAxis: 'visitors' },
                layout: { i: 'chart-1', x: 0, y: 2, w: 8, h: 4 }
            },
            {
                id: 'chart-2',
                type: 'pie',
                title: 'Traffic Sources',
                config: { dimension: 'source', metric: 'visitors' },
                layout: { i: 'chart-2', x: 8, y: 2, w: 4, h: 4 }
            },
            {
                id: 'chart-3',
                type: 'bar',
                title: 'Campaign Performance',
                config: { xAxis: 'campaign', yAxis: 'conversions' },
                layout: { i: 'chart-3', x: 0, y: 6, w: 6, h: 4 }
            },
            {
                id: 'chart-4',
                type: 'bar',
                title: 'Top Landing Pages',
                config: { xAxis: 'page', yAxis: 'visitors' },
                layout: { i: 'chart-4', x: 6, y: 6, w: 6, h: 4 }
            }
        ]
    },
    {
        id: 'finance',
        name: 'Finance Dashboard',
        description: 'Track expenses, profit margins, and financial health',
        icon: '💵',
        color: '#8b5cf6',
        widgets: [
            {
                id: 'kpi-1',
                type: 'kpi',
                title: 'Total Revenue',
                config: { metric: 'revenue', format: 'currency' },
                layout: { i: 'kpi-1', x: 0, y: 0, w: 3, h: 2 }
            },
            {
                id: 'kpi-2',
                type: 'kpi',
                title: 'Total Expenses',
                config: { metric: 'expenses', format: 'currency' },
                layout: { i: 'kpi-2', x: 3, y: 0, w: 3, h: 2 }
            },
            {
                id: 'kpi-3',
                type: 'kpi',
                title: 'Net Profit',
                config: { metric: 'profit', format: 'currency' },
                layout: { i: 'kpi-3', x: 6, y: 0, w: 3, h: 2 }
            },
            {
                id: 'kpi-4',
                type: 'kpi',
                title: 'Profit Margin',
                config: { metric: 'margin', format: 'percentage' },
                layout: { i: 'kpi-4', x: 9, y: 0, w: 3, h: 2 }
            },
            {
                id: 'chart-1',
                type: 'line',
                title: 'Revenue vs Expenses',
                config: { xAxis: 'month', yAxis: ['revenue', 'expenses'] },
                layout: { i: 'chart-1', x: 0, y: 2, w: 8, h: 4 }
            },
            {
                id: 'chart-2',
                type: 'pie',
                title: 'Expense Breakdown',
                config: { dimension: 'category', metric: 'amount' },
                layout: { i: 'chart-2', x: 8, y: 2, w: 4, h: 4 }
            },
            {
                id: 'chart-3',
                type: 'bar',
                title: 'Monthly Profit',
                config: { xAxis: 'month', yAxis: 'profit' },
                layout: { i: 'chart-3', x: 0, y: 6, w: 6, h: 4 }
            },
            {
                id: 'chart-4',
                type: 'area',
                title: 'Cash Flow',
                config: { xAxis: 'date', yAxis: 'balance' },
                layout: { i: 'chart-4', x: 6, y: 6, w: 6, h: 4 }
            }
        ]
    }
]

// Get template by ID
export const getTemplate = (id) => DASHBOARD_TEMPLATES.find(t => t.id === id)

// Get template preview data (for display in selector)
export const getTemplatePreview = (id) => {
    const template = getTemplate(id)
    if (!template) return null

    return {
        id: template.id,
        name: template.name,
        description: template.description,
        icon: template.icon,
        color: template.color,
        widgetCount: template.widgets.length,
        chartTypes: [...new Set(template.widgets.filter(w => w.type !== 'kpi').map(w => w.type))]
    }
}
