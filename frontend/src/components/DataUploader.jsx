import { useState, useCallback } from 'react'
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function DataUploader({ onUploadSuccess }) {
    const [isDragging, setIsDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadResult, setUploadResult] = useState(null)
    const [error, setError] = useState(null)

    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        setIsDragging(false)

        const files = e.dataTransfer.files
        if (files.length > 0) {
            handleUpload(files[0])
        }
    }, [])

    const handleFileSelect = (e) => {
        const files = e.target.files
        if (files.length > 0) {
            handleUpload(files[0])
        }
    }

    const handleUpload = async (file) => {
        // Dosya tipi kontrolü
        const allowedTypes = ['.csv', '.xlsx', '.xls']
        const ext = '.' + file.name.split('.').pop().toLowerCase()

        if (!allowedTypes.includes(ext)) {
            setError('Only CSV and Excel files are supported')
            return
        }

        // Dosya boyutu kontrolü (50MB)
        if (file.size > 50 * 1024 * 1024) {
            setError('File size cannot be larger than 50 MB')
            return
        }

        setUploading(true)
        setError(null)
        setUploadResult(null)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await axios.post(`${API_URL}/api/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            setUploadResult(response.data)
            if (onUploadSuccess) {
                onUploadSuccess(response.data)
            }
        } catch (err) {
            console.error('Upload error:', err)
            setError(err.response?.data?.detail || 'An error occurred while uploading the file')
        } finally {
            setUploading(false)
        }
    }

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    return (
        <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-800">Upload Data</h3>
            </div>

            {/* Drag & Drop Area */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${isDragging
                        ? 'border-gray-500 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
            >
                <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                />

                <div className="flex flex-col items-center gap-3">
                    {uploading ? (
                        <>
                            <Loader2 className="w-12 h-12 text-gray-600 animate-spin" />
                            <p className="text-gray-600">Uploading...</p>
                        </>
                    ) : (
                        <>
                            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                                <FileSpreadsheet className="w-7 h-7 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-gray-700 font-medium">
                                    Drag and drop file here or click to select
                                </p>
                                <p className="text-gray-400 text-sm mt-1">
                                    CSV, Excel (.xlsx, .xls) - Max. 50 MB
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-gray-700 text-sm">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="text-gray-500 text-xs mt-1 hover:underline"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {uploadResult && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-300 rounded-lg">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-gray-700 font-medium">File uploaded successfully!</p>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                                <div>
                                    <span className="text-gray-400">Table:</span>{' '}
                                    <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                                        {uploadResult.table_name}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Size:</span>{' '}
                                    {formatFileSize(uploadResult.file_size)}
                                </div>
                                <div>
                                    <span className="text-gray-400">Rows:</span>{' '}
                                    {uploadResult.row_count.toLocaleString('tr-TR')}
                                </div>
                                <div>
                                    <span className="text-gray-400">Columns:</span>{' '}
                                    {uploadResult.column_count}
                                </div>
                            </div>
                            <button
                                onClick={() => setUploadResult(null)}
                                className="mt-2 text-gray-600 text-xs hover:underline"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
