-- Migration: 02_push_subscriptions.sql
CREATE TABLE IF NOT EXISTS public.user_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own subscriptions"
  ON public.user_push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscriptions"
  ON public.user_push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
  ON public.user_push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);
