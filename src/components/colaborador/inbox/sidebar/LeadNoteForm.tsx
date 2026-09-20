import { Activity, Send } from 'lucide-react'

interface LeadNoteFormProps {
  noteText: string;
  setNoteText: (text: string) => void;
  onSendNote: () => void;
  isUpdating: boolean;
}

export function LeadNoteForm({ noteText, setNoteText, onSendNote, isUpdating }: LeadNoteFormProps) {
  return (
    <div className="p-4 bg-white border-t border-gray-200 z-10 shrink-0">
      <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all shadow-sm">
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSendNote()
            }
          }}
          placeholder="Adicione um comentário..."
          className="flex-1 bg-transparent border-0 focus:ring-0 outline-none text-gray-700 text-[14px] resize-none max-h-[120px] min-h-[40px] px-3 py-2.5 placeholder-gray-400"
          rows={1}
        />
        <button
          onClick={onSendNote}
          disabled={isUpdating || !noteText.trim()}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 flex-shrink-0 mb-0.5 mr-0.5 shadow-sm"
        >
          {isUpdating ? <Activity className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
      <div className="text-[10px] text-gray-400 text-center mt-2 font-medium">
        Pressione Enter para enviar
      </div>
    </div>
  )
}
