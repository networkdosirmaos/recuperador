-- =====================================================================================
-- FASE 1: Inteligência no Banco de Dados (Triagem de Leads)
-- Arquivo: supabase/migrations/01_leads_triage_functions.sql
-- =====================================================================================

CREATE OR REPLACE FUNCTION get_leads_by_bucket(
    p_user_id UUID,
    p_bucket TEXT,
    p_offset INT DEFAULT 0,
    p_limit INT DEFAULT 20
)
RETURNS SETOF leads
LANGUAGE sql
SECURITY INVOKER
AS $$
    SELECT l.*
    FROM leads l
    WHERE l.current_assignee_id = p_user_id
      AND (
        CASE
            WHEN l.status = 'venda_organica' OR l.gateway_event = 'purchase_approved' OR l.gateway_status = 'approved' THEN 'ignorar'
            WHEN l.status IN ('recuperado', 'perdido') THEN 'finalizados'
            WHEN l.gateway_event IN ('pix_generated', 'pix_gerado', 'waiting_payment') 
                 AND l.status = 'novo' 
                 AND COALESCE(l.updated_at, l.created_at) > (NOW() - INTERVAL '6 hours') THEN 'geladeira'
            WHEN l.status = 'em_atendimento' THEN 'em_andamento'
            WHEN l.status = 'novo' OR (l.next_action_at IS NOT NULL AND l.next_action_at <= NOW()) THEN 'pendentes'
            ELSE 'em_andamento'
        END
      ) = p_bucket
    ORDER BY l.updated_at DESC
    OFFSET p_offset
    LIMIT p_limit;
$$;


CREATE OR REPLACE FUNCTION get_lead_counts(p_user_id UUID)
RETURNS json
LANGUAGE sql
SECURITY INVOKER
AS $$
    WITH categorized AS (
        SELECT 
        CASE
            WHEN l.status = 'venda_organica' OR l.gateway_event = 'purchase_approved' OR l.gateway_status = 'approved' THEN 'ignorar'
            WHEN l.status IN ('recuperado', 'perdido') THEN 'finalizados'
            WHEN l.gateway_event IN ('pix_generated', 'pix_gerado', 'waiting_payment') AND l.status = 'novo' AND COALESCE(l.updated_at, l.created_at) > (NOW() - INTERVAL '6 hours') THEN 'geladeira'
            WHEN l.status = 'em_atendimento' THEN 'em_andamento'
            WHEN l.status = 'novo' OR (l.next_action_at IS NOT NULL AND l.next_action_at <= NOW()) THEN 'pendentes'
            ELSE 'em_andamento'
        END as bucket
        FROM leads l
        WHERE l.current_assignee_id = p_user_id
    )
    SELECT json_build_object(
        'pendentes', COUNT(*) FILTER (WHERE bucket = 'pendentes'),
        'em_andamento', COUNT(*) FILTER (WHERE bucket = 'em_andamento'),
        'finalizados', COUNT(*) FILTER (WHERE bucket = 'finalizados'),
        'geladeira', COUNT(*) FILTER (WHERE bucket = 'geladeira')
    )
    FROM categorized;
$$;
