import { useEffect, useCallback } from 'react'

// Keyboard Shortcuts Hook
export function useKeyboardShortcuts(shortcuts) {
    const handleKeyDown = useCallback((event) => {
        // Skip if user is typing in an input/textarea
        const target = event.target
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            // Only allow Escape in inputs
            if (event.key !== 'Escape') return
        }

        for (const shortcut of shortcuts) {
            const { key, ctrl = false, shift = false, alt = false, action, enabled = true } = shortcut

            if (!enabled) continue

            const keyMatches = event.key.toLowerCase() === key.toLowerCase()
            const ctrlMatches = event.ctrlKey === ctrl || event.metaKey === ctrl  // Support Mac Cmd
            const shiftMatches = event.shiftKey === shift
            const altMatches = event.altKey === alt

            if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
                event.preventDefault()
                action()
                return
            }
        }
    }, [shortcuts])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])
}

// Shortcut help modal - shows available shortcuts
export const GLOBAL_SHORTCUTS = [
    { key: 'k', ctrl: true, label: 'Quick Search', description: 'Open quick search' },
    { key: 'n', ctrl: true, label: 'New Query', description: 'Start a new query' },
    { key: 'd', ctrl: true, label: 'Dashboard', description: 'Go to Dashboard' },
    { key: '/', ctrl: false, label: 'Focus Search', description: 'Focus the search input' },
    { key: 'Escape', ctrl: false, label: 'Close', description: 'Close modals/menus' },
    { key: '?', shift: true, label: 'Help', description: 'Show keyboard shortcuts' },
]
