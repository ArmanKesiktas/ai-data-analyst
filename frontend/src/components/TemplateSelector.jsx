import { X, LayoutTemplate, Check } from 'lucide-react'
import { DASHBOARD_TEMPLATES } from '../data/dashboardTemplates'

export default function TemplateSelector({ onSelect, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
                className="w-full max-w-3xl rounded-xl shadow-xl animate-dropdown"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            <LayoutTemplate className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                                Choose a Template
                            </h2>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                Start with a pre-built dashboard layout
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                        <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    </button>
                </div>

                {/* Templates Grid */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {DASHBOARD_TEMPLATES.map(template => (
                        <button
                            key={template.id}
                            onClick={() => onSelect(template)}
                            className="p-5 rounded-xl border-2 text-left transition-all hover:scale-[1.02] hover:shadow-lg group"
                            style={{
                                borderColor: 'var(--border-color)',
                                backgroundColor: 'var(--bg-secondary)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = template.color}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                        >
                            {/* Icon */}
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                                style={{ backgroundColor: `${template.color}20` }}
                            >
                                {template.icon}
                            </div>

                            {/* Title & Description */}
                            <h3
                                className="font-semibold mb-1"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {template.name}
                            </h3>
                            <p
                                className="text-sm mb-4"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                {template.description}
                            </p>

                            {/* Stats */}
                            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                                <span className="px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                    {template.widgets.filter(w => w.type === 'kpi').length} KPIs
                                </span>
                                <span className="px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                    {template.widgets.filter(w => w.type !== 'kpi').length} Charts
                                </span>
                            </div>

                            {/* Hover Effect */}
                            <div
                                className="mt-4 flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ color: template.color }}
                            >
                                <Check className="w-4 h-4" />
                                Use Template
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Or start with a blank dashboard
                    </p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)'
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
