'use server'

import { createClient } from '@/utils/supabase/server'
import { requireAuthenticatedUser } from './auth.utils'

type PushSubscriptionJSON = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function savePushSubscription(sub: PushSubscriptionJSON) {
  try {
    const user = await requireAuthenticatedUser()
    const supabase = await createClient()

    const { error } = await supabase.from('user_push_subscriptions').upsert({
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    }, { onConflict: 'endpoint' })

    if (error) {
      console.error('Supabase Error:', error)
      throw error
    }
    return { success: true }
  } catch (err) {
    console.error('Failed to save push subscription:', err)
    return { success: false, error: 'Failed to save push subscription' }
  }
}
