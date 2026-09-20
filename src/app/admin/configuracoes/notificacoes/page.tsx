import { getNotificationTemplate } from '@/app/actions/notification.actions'
import { NotificationForm } from './notification-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Configurar Notificações',
}

export default async function NotificacoesPage() {
  const template = await getNotificationTemplate('NEW_LEAD')
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Notificações Push</h1>
      <p className="text-zinc-500 mb-8">
        Configure as mensagens que os vendedores recebem em seus celulares via Push Notification (PWA).
      </p>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
        <div className="mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <h2 className="text-lg font-semibold">Gatilho: Novo Lead na Fila</h2>
          <p className="text-sm text-zinc-500">
            Disparado imediatamente quando um novo lead é recebido pelo webhook e designado para um vendedor.
          </p>
        </div>
        
        <NotificationForm initialData={template} />
      </div>
    </div>
  )
}
