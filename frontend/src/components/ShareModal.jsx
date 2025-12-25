import { useState, useEffect } from 'react'
import { X, Send, Hash, Settings, Check, AlertCircle } from 'lucide-react'
import { sendToSlack, sendToTeams, getWebhookSettings, saveWebhookSettings } from '../services/notificationService'

export default function ShareModal({ dashboard, onClose }) {
    const [activeTab, setActiveTab] = useState('share') // 'share' | 'settings'
    const [settings, setSettings] = useState({ slack: '', teams: '' })
    const [sending, setSending] = useState(false)
    const [result, setResult] = useState(null) // { success: boolean, message: string }

    useEffect(() => {
        setSettings(getWebhookSettings())
    }, [])

    const handleSaveSettings = () => {
        saveWebhookSettings(settings)
        setResult({ success: true, message: 'Settings saved!' })
        setTimeout(() => setResult(null), 2000)
    }

    const handleShare = async (platform) => {
        const webhookUrl = platform === 'slack' ? settings.slack : settings.teams

        if (!webhookUrl) {
            setResult({ success: false, message: `Please configure ${platform} webhook URL first` })
            return
        }

        setSending(true)
        setResult(null)

        try {
            const success = platform === 'slack'
                ? await sendToSlack(webhookUrl, dashboard)
                : await sendToTeams(webhookUrl, dashboard)

            if (success) {
                setResult({ success: true, message: `Dashboard shared to ${platform}!` })
            } else {
                setResult({ success: false, message: `Failed to send to ${platform}` })
            }
        } catch (error) {
            setResult({ success: false, message: error.message })
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
                className="w-full max-w-md rounded-xl shadow-xl animate-dropdown"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Share Dashboard
                    </h2>
                    <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700">
                        <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <button
                        onClick={() => setActiveTab('share')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'share'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Send className="w-4 h-4 inline mr-2" />
                        Share
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'settings'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Settings className="w-4 h-4 inline mr-2" />
                        Settings
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {activeTab === 'share' ? (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-500 mb-4">
                                Share "{dashboard?.title || 'Dashboard'}" to your team channels
                            </p>

                            {/* Slack */}
                            <button
                                onClick={() => handleShare('slack')}
                                disabled={sending || !settings.slack}
                                className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all ${settings.slack
                                        ? 'hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer'
                                        : 'opacity-50 cursor-not-allowed'
                                    }`}
                                style={{ borderColor: 'var(--border-color)' }}
                            >
                                <div className="w-10 h-10 rounded-lg bg-[#4A154B] flex items-center justify-center">
                                    <Hash className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Slack</p>
                                    <p className="text-xs text-gray-500">
                                        {settings.slack ? 'Webhook configured' : 'Not configured'}
                                    </p>
                                </div>
                                {sending && <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                            </button>

                            {/* Teams */}
                            <button
                                onClick={() => handleShare('teams')}
                                disabled={sending || !settings.teams}
                                className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all ${settings.teams
                                        ? 'hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer'
                                        : 'opacity-50 cursor-not-allowed'
                                    }`}
                                style={{ borderColor: 'var(--border-color)' }}
                            >
                                <div className="w-10 h-10 rounded-lg bg-[#6264A7] flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">T</span>
                                </div>
                                <div className="text-left flex-1">
                                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Microsoft Teams</p>
                                    <p className="text-xs text-gray-500">
                                        {settings.teams ? 'Webhook configured' : 'Not configured'}
                                    </p>
                                </div>
                                {sending && <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 mb-4">
                                Configure your webhook URLs for Slack and Teams
                            </p>

                            {/* Slack URL */}
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Slack Webhook URL
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://hooks.slack.com/services/..."
                                    value={settings.slack}
                                    onChange={(e) => setSettings(prev => ({ ...prev, slack: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
                                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                                />
                            </div>

                            {/* Teams URL */}
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Teams Webhook URL
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://outlook.office.com/webhook/..."
                                    value={settings.teams}
                                    onChange={(e) => setSettings(prev => ({ ...prev, teams: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
                                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                                />
                            </div>

                            <button
                                onClick={handleSaveSettings}
                                className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                Save Settings
                            </button>
                        </div>
                    )}

                    {/* Result Message */}
                    {result && (
                        <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {result.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {result.message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
