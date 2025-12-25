import { useState } from 'react'
import { X, User, Mail, Camera } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'

export default function ProfileSettingsModal({ onClose }) {
    const { profile, updateProfile } = useWorkspace()
    const [formData, setFormData] = useState({
        name: profile.name,
        email: profile.email
    })
    const [saved, setSaved] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        updateProfile(formData)
        setSaved(true)
        setTimeout(() => {
            onClose()
        }, 1000)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-800">Profile Settings</h2>
                            <p className="text-sm text-gray-500">Update your personal information</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4">
                    {/* Avatar */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                                <User className="w-10 h-10 text-white" />
                            </div>
                            <button
                                type="button"
                                className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50"
                            >
                                <Camera className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <span className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Name
                                </span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Your name"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <span className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Email
                                </span>
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="your@email.com"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                            />
                        </div>
                    </div>

                    {saved && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
                            ✓ Profile updated successfully!
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={saved}
                        >
                            {saved ? 'Saved!' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
