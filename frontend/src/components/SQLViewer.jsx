import { useState } from 'react'
import { Code, ChevronDown, ChevronUp, Copy, Check, Terminal } from 'lucide-react'

export default function SQLViewer({ sql }) {
  const [isOpen, setIsOpen] = useState(true)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Format SQL for better readability
  const formatSQL = (sqlString) => {
    return sqlString
      .replace(/SELECT/gi, 'SELECT')
      .replace(/FROM/gi, '\nFROM')
      .replace(/WHERE/gi, '\nWHERE')
      .replace(/GROUP BY/gi, '\nGROUP BY')
      .replace(/ORDER BY/gi, '\nORDER BY')
      .replace(/LIMIT/gi, '\nLIMIT')
      .replace(/AND/gi, '\n  AND')
      .replace(/OR/gi, '\n  OR')
  }

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-gray-600" />
          <span className="font-semibold">SQL Sorgusu</span>
          <span className="badge bg-gray-100 text-gray-600 ml-2">Auto-generated</span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {isOpen && (
        <div className="px-6 pb-6">
          <div className="relative">
            <pre className="bg-gray-900 rounded-xl p-4 text-sm overflow-x-auto font-mono">
              <code className="text-gray-300">{formatSQL(sql)}</code>
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors group"
              title="Kopyala"
            >
              {copied ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400 group-hover:text-white" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
