-- Migration: 04_notification_templates.sql
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir um template padrão para evitar banco vazio
INSERT INTO public.notification_templates (event_type, title, body)
VALUES (
  'NEW_LEAD',
  'Novo Lead: {PRODUTO} 💸',
  'O lead {NOME} acabou de entrar na sua fila. Chame agora!'
) ON CONFLICT (event_type) DO NOTHING;
