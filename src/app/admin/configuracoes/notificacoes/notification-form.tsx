'use client'

import { useState, useTransition } from 'react'
import { updateNotificationTemplate } from '@/app/actions/notification.actions'
import toast from 'react-hot-toast'
import { Save } from 'lucide-react'

export function NotificationForm({ initialData }: { initialData: any }) {
  const [title, setTitle] = useState(initialData?.title || 'Novo Lead: {PRODUTO} 💸')
  const [body, setBody] = useState(initialData?.body || 'O lead {NOME} acabou de entrar na sua fila. Atenda agora!')
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateNotificationTemplate('NEW_LEAD', title, body)
      if (res.success) {
        toast.success('Copy da notificação salva com sucesso!')
      } else {
        toast.error('Erro: ' + res.error)
      }
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1.5">Título da Notificação</label>
        <input 
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full border border-zinc-300 dark:border-zinc-700 rounded-md p-2.5 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          placeholder="Ex: Novo Lead: {PRODUTO}"
          maxLength={64}
        />
        <p className="text-xs text-zinc-500 mt-1">Recomendado manter curto (até 50 caracteres).</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Corpo da Mensagem</label>
        <textarea 
          value={body}
          onChange={e => setBody(e.target.value)}
          className="w-full border border-zinc-300 dark:border-zinc-700 rounded-md p-2.5 bg-transparent h-28 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
          placeholder="Ex: O cliente {NOME} gerou um Pix."
          maxLength={150}
        />
      </div>

      <div className="text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded-md flex flex-col gap-1">
        <strong>Variáveis Dinâmicas Disponíveis:</strong>
        <p>Use as chaves abaixo para personalizar a mensagem com os dados do lead real:</p>
        <code className="bg-blue-100 dark:bg-blue-800/50 px-2 py-1 rounded mt-1 inline-block w-fit">
          {`{NOME}`} - O nome do cliente
        </code>
        <code className="bg-blue-100 dark:bg-blue-800/50 px-2 py-1 rounded inline-block w-fit">
          {`{PRODUTO}`} - O nome do produto comprado/abandonado
        </code>
      </div>

      <div className="pt-2">
        <button 
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {isPending ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  )
}
