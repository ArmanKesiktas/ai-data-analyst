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
    <div className="card overflow-hidden h-full flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-gray-600" />
          <span className="font-semibold text-gray-800">SQL Query</span>
          <span className="badge bg-gray-100 text-gray-600 ml-2">Auto-generated</span>
        </div>
        <button
          onClick={handleCopy}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
          title="Copy"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          )}
        </button>
      </div>
      <div className="flex-1 p-6">
        <pre className="bg-gray-900 rounded-xl p-4 text-sm overflow-x-auto font-mono h-full min-h-[200px]">
          <code className="text-green-400">{formatSQL(sql)}</code>
        </pre>
      </div>
    </div>
  )
}
