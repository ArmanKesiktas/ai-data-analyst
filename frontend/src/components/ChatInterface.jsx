import { useState } from 'react'
import { Send, Loader2, Sparkles } from 'lucide-react'

const EXAMPLE_QUESTIONS = [
  "Son 6 ayda en çok gelir getiren kategori hangisi?",
  "Bu yıl kaç adet ürün satıldı?",
  "Geçen aya göre bu ay satışlar ne kadar arttı?",
  "En pahalı 5 ürün nedir?",
  "Gıda kategorisinde ortalama satış değeri nedir?",
  "Elektronik ve giyim kategorilerini karşılaştır",
  "Son 3 ayda hangi ürün en çok satıldı?"
]

export default function ChatInterface({ onAnalyze, loading }) {
  const [question, setQuestion] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (question.trim() && !loading) {
      onAnalyze(question)
    }
  }

  const handleExampleClick = (exampleQuestion) => {
    setQuestion(exampleQuestion)
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
      <div className="flex items-center mb-4">
        <Sparkles className="w-5 h-5 text-yellow-300 mr-2" />
        <h2 className="text-white font-semibold text-lg">Soru Sorun</h2>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Örnek: Son 6 ayda en çok gelir getiren kategori hangisi?"
            className="flex-1 px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed border border-white/30 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analiz ediliyor...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Gönder</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Example Questions */}
      <div>
        <p className="text-white/60 text-sm mb-3">Örnek sorular:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map((eq, idx) => (
            <button
              key={idx}
              onClick={() => handleExampleClick(eq)}
              disabled={loading}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed border border-white/20 rounded-full text-white/80 text-sm transition-colors"
            >
              {eq}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
