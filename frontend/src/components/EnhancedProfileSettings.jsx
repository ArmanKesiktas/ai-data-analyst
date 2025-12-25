import { useState } from 'react'
import { X, User, Mail, Camera, Key, Shield, Bell, Globe, Moon, Sun, Smartphone } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import { useAuth } from '../context/AuthContext'

/**
 * EnhancedProfileSettings - Comprehensive profile settings page
 *
 * Features:
 * - Personal information
 * - Password change
 * - Security settings (2FA)
 * - Notification preferences
 * - Appearance settings
 * - Language preferences
 */
export default function EnhancedProfileSettings({ onClose }) {
    const { profile, updateProfile } = useWorkspace()
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('profile')
    const [formData, setFormData] = useState({
        name: profile.name,
        email: profile.email,
        bio: profile.bio || '',
        phone: profile.phone || '',
        timezone: profile.timezone || 'UTC',
        language: profile.language || 'en',
        twoFactorEnabled: profile.twoFactorEnabled || false,
        emailNotifications: profile.emailNotifications !== false,
        pushNotifications: profile.pushNotifications || false,
        theme: profile.theme || 'light'
    })
    const [password, setPassword] = useState({
        current: '',
        new: '',
        confirm: ''
    })
    const [saved, setSaved] = useState(false)

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'preferences', label: 'Preferences', icon: Globe }
    ]

    const handleSubmit = (e) => {
        e.preventDefault()
        updateProfile(formData)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    }

    const handlePasswordChange = (e) => {
        e.preventDefault()
        if (password.new !== password.confirm) {
            alert('Passwords do not match')
            return
        }
        // Here you would make an API call to change password
        alert('Password changed successfully!')
        setPassword({ current: '', new: '', confirm: '' })
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Account Settings</h2>
                            <p className="text-sm text-gray-500">Manage your account preferences</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 px-6">
                    <div className="flex gap-1">
                        {tabs.map(tab => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-gray-800 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="font-medium">{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Avatar */}
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <User className="w-12 h-12 text-white" />
                                    </div>
                                    <button
                                        type="button"
                                        className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 border-2 border-gray-100"
                                    >
                                        <Camera className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{formData.name}</h3>
                                    <p className="text-sm text-gray-500">{user?.email || formData.email}</p>
                                    <button
                                        type="button"
                                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Change Photo
                                    </button>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+1 (555) 123-4567"
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Timezone
                                    </label>
                                    <select
                                        value={formData.timezone}
                                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                    >
                                        <option value="UTC">UTC (GMT+0)</option>
                                        <option value="America/New_York">Eastern Time (GMT-5)</option>
                                        <option value="America/Los_Angeles">Pacific Time (GMT-8)</option>
                                        <option value="Europe/London">London (GMT+0)</option>
                                        <option value="Europe/Istanbul">Istanbul (GMT+3)</option>
                                        <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bio
                                </label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    rows={3}
                                    placeholder="Tell us about yourself..."
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none"
                                />
                            </div>

                            {saved && (
                                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-700 text-center">
                                    ✓ Profile updated successfully!
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            {/* Change Password */}
                            <div className="p-6 border-2 border-gray-200 rounded-xl">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Key className="w-5 h-5" />
                                    Change Password
                                </h3>
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            value={password.current}
                                            onChange={(e) => setPassword({ ...password, current: e.target.value })}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                value={password.new}
                                                onChange={(e) => setPassword({ ...password, new: e.target.value })}
                                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Confirm Password
                                            </label>
                                            <input
                                                type="password"
                                                value={password.confirm}
                                                onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                                    >
                                        Update Password
                                    </button>
                                </form>
                            </div>

                            {/* Two-Factor Authentication */}
                            <div className="p-6 border-2 border-gray-200 rounded-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Smartphone className="w-5 h-5" />
                                            Two-Factor Authentication
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Add an extra layer of security to your account
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.twoFactorEnabled}
                                            onChange={(e) => setFormData({ ...formData, twoFactorEnabled: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                {formData.twoFactorEnabled && (
                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-700">
                                            Scan the QR code with your authenticator app to enable 2FA.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-4">
                            <div className="p-6 border-2 border-gray-200 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Email Notifications</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Receive email updates about your activity
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.emailNotifications}
                                            onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="p-6 border-2 border-gray-200 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Push Notifications</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Get push notifications on your devices
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.pushNotifications}
                                            onChange={(e) => setFormData({ ...formData, pushNotifications: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={handleSubmit}
                                    className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                                >
                                    Save Preferences
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Preferences Tab */}
                    {activeTab === 'preferences' && (
                        <div className="space-y-6">
                            <div className="p-6 border-2 border-gray-200 rounded-xl">
                                <h3 className="font-semibold text-gray-900 mb-4">Appearance</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'light', icon: Sun, label: 'Light' },
                                        { value: 'dark', icon: Moon, label: 'Dark' },
                                        { value: 'auto', icon: Smartphone, label: 'Auto' }
                                    ].map(theme => {
                                        const Icon = theme.icon
                                        return (
                                            <button
                                                key={theme.value}
                                                onClick={() => setFormData({ ...formData, theme: theme.value })}
                                                className={`p-4 border-2 rounded-xl transition-all ${
                                                    formData.theme === theme.value
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <Icon className="w-6 h-6 mx-auto mb-2" />
                                                <div className="text-sm font-medium">{theme.label}</div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="p-6 border-2 border-gray-200 rounded-xl">
                                <h3 className="font-semibold text-gray-900 mb-4">Language</h3>
                                <select
                                    value={formData.language}
                                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                >
                                    <option value="en">English</option>
                                    <option value="tr">Türkçe</option>
                                    <option value="es">Español</option>
                                    <option value="fr">Français</option>
                                    <option value="de">Deutsch</option>
                                    <option value="ja">日本語</option>
                                </select>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={handleSubmit}
                                    className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                                >
                                    Save Preferences
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
