import { X, Keyboard } from 'lucide-react'
import { GLOBAL_SHORTCUTS } from '../hooks/useKeyboardShortcuts'

export default function KeyboardShortcutsModal({ onClose }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md animate-dropdown" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            <Keyboard className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                        </div>
                        <div>
                            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Keyboard Shortcuts</h2>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Quick navigation and actions</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                        <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    </button>
                </div>

                {/* Shortcuts List */}
                <div className="p-4 space-y-2">
                    {GLOBAL_SHORTCUTS.map((shortcut, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between py-2 px-3 rounded-lg"
                            style={{ backgroundColor: 'var(--bg-tertiary)' }}
                        >
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {shortcut.description}
                            </span>
                            <kbd className="px-2 py-1 text-xs font-mono rounded border" style={{
                                backgroundColor: 'var(--bg-secondary)',
                                borderColor: 'var(--border-color)',
                                color: 'var(--text-primary)'
                            }}>
                                {shortcut.ctrl && '⌘/Ctrl + '}
                                {shortcut.shift && 'Shift + '}
                                {shortcut.key === 'Escape' ? 'Esc' : shortcut.key.toUpperCase()}
                            </kbd>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t text-center" style={{ borderColor: 'var(--border-light)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Press <kbd className="px-1 py-0.5 text-xs font-mono rounded border" style={{ borderColor: 'var(--border-color)' }}>Shift + ?</kbd> anywhere to show this help
                    </p>
                </div>
            </div>
        </div>
    )
}
