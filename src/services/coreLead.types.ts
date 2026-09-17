import type { Json } from '@/types/database.types'

export interface NormalizedWebhookPayload {
  listId: string
  event: string
  gateway: string
  nome: string | null
  email: string | null
  phone: string | null
  produto: string
  customerId: string | null
  gatewayStatus: string
  updatedAt: string
  paymentMethod: string | null
  refusalReason: string | null
  refundedAt: string | null
  chargedbackAt: string | null
  refundReason: string | null
  affiliateEmail?: string | null
  isPing: boolean
  rawPayload: Json
}
