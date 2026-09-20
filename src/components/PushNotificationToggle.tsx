'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { savePushSubscription } from '@/app/actions/push.actions'
import toast from 'react-hot-toast'

export function PushNotificationToggle() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      checkSubscription()
    }
  }, [])

  async function checkSubscription() {
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.getSubscription()
    setIsSubscribed(!!sub)
  }

  async function subscribe() {
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error('Permissão para notificações negada.')
        return
      }

      const registration = await navigator.serviceWorker.ready
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      
      if (!vapidPublicKey) {
        toast.error('Chave VAPID pública não encontrada. Contate o suporte.')
        return
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      })

      const subJson = subscription.toJSON()
      const result = await savePushSubscription(subJson as any)

      if (result.success) {
        setIsSubscribed(true)
        toast.success('Notificações ativadas com sucesso!')
      } else {
        toast.error('Erro ao salvar no servidor.')
      }
    } catch (error) {
      console.error('Erro ao inscrever:', error)
      toast.error('Erro ao ativar notificações.')
    }
  }

  return (
    <button
      onClick={subscribe}
      disabled={!isSupported || isSubscribed}
      className="flex items-center gap-2 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
      title={!isSupported ? 'Não suportado no seu navegador' : isSubscribed ? 'Já inscrito' : 'Ativar notificações para novos leads'}
    >
      {isSubscribed ? <Bell className="w-5 h-5 text-blue-500" /> : <BellOff className="w-5 h-5 text-zinc-500" />}
      <span className="text-sm font-medium hidden sm:inline">
        {isSubscribed ? 'Notificações Ativas' : 'Ativar Notificações'}
      </span>
    </button>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
