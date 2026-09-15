-- Add character_skill_id column to skill_templates to track sync
ALTER TABLE public.skill_templates ADD COLUMN IF NOT EXISTS character_skill_id uuid;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_skill_templates_character_skill_id ON public.skill_templates(character_skill_id);

-- Function to sync a character_skill to skill_templates
CREATE OR REPLACE FUNCTION public.sync_skill_to_template(p_skill_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_skill record;
  v_profile record;
  v_existing uuid;
BEGIN
  SELECT * INTO v_skill FROM public.character_skills WHERE id = p_skill_id;
  IF NOT FOUND THEN
    DELETE FROM public.skill_templates WHERE character_skill_id = p_skill_id;
    RETURN;
  END IF;

  SELECT oc_name, email INTO v_profile FROM public.profiles WHERE id = v_skill.user_id;
  SELECT id INTO v_existing FROM public.skill_templates WHERE character_skill_id = p_skill_id;

  IF v_skill.skill_status = 'approved' THEN
    IF v_existing IS NOT NULL THEN
      UPDATE public.skill_templates SET
        name = v_skill.name,
        usage_detail = v_skill.usage_detail,
        effect = v_skill.effect,
        tradeoff = v_skill.tradeoff,
        cong_duc_cost = v_skill.cong_duc_cost,
        am_duc_cost = v_skill.am_duc_cost,
        duration = v_skill.duration,
        mental_effect = v_skill.mental_effect,
        mental_duration = v_skill.mental_duration,
        health_effect = v_skill.health_effect,
        health_duration = v_skill.health_duration,
        spiritual_effect = v_skill.spiritual_effect,
        spiritual_duration = v_skill.spiritual_duration,
        ghost_level_effect = v_skill.ghost_level_effect,
        destruction_percent = v_skill.destruction_percent,
        oc_name = v_profile.oc_name,
        account = v_profile.email,
        phe_duyet = 'Đã duyệt',
        updated_at = now()
      WHERE id = v_existing;
    ELSE
      INSERT INTO public.skill_templates (
        character_skill_id, name, usage_detail, effect, tradeoff,
        cong_duc_cost, am_duc_cost, duration,
        mental_effect, mental_duration, health_effect, health_duration,
        spiritual_effect, spiritual_duration, ghost_level_effect, destruction_percent,
        oc_name, account, phe_duyet, created_at, updated_at
      ) VALUES (
        p_skill_id, v_skill.name, v_skill.usage_detail, v_skill.effect, v_skill.tradeoff,
        v_skill.cong_duc_cost, v_skill.am_duc_cost, v_skill.duration,
        v_skill.mental_effect, v_skill.mental_duration, v_skill.health_effect, v_skill.health_duration,
        v_skill.spiritual_effect, v_skill.spiritual_duration, v_skill.ghost_level_effect, v_skill.destruction_percent,
        v_profile.oc_name, v_profile.email, 'Đã duyệt', now(), now()
      );
    END IF;
  ELSIF v_skill.skill_status = 'rejected' THEN
    IF v_existing IS NOT NULL THEN
      UPDATE public.skill_templates SET phe_duyet = 'Từ chối', updated_at = now() WHERE id = v_existing;
    END IF;
  ELSE
    IF v_existing IS NOT NULL THEN
      UPDATE public.skill_templates SET
        name = v_skill.name,
        usage_detail = v_skill.usage_detail,
        effect = v_skill.effect,
        tradeoff = v_skill.tradeoff,
        cong_duc_cost = v_skill.cong_duc_cost,
        am_duc_cost = v_skill.am_duc_cost,
        duration = v_skill.duration,
        mental_effect = v_skill.mental_effect,
        mental_duration = v_skill.mental_duration,
        health_effect = v_skill.health_effect,
        health_duration = v_skill.health_duration,
        spiritual_effect = v_skill.spiritual_effect,
        spiritual_duration = v_skill.spiritual_duration,
        ghost_level_effect = v_skill.ghost_level_effect,
        destruction_percent = v_skill.destruction_percent,
        oc_name = v_profile.oc_name,
        account = v_profile.email,
        updated_at = now()
      WHERE id = v_existing;
    END IF;
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.sync_skill_to_template(uuid) TO authenticated;

-- Backfill: sync all existing approved character_skills
INSERT INTO public.skill_templates (
  character_skill_id, name, usage_detail, effect, tradeoff,
  cong_duc_cost, am_duc_cost, duration,
  mental_effect, mental_duration, health_effect, health_duration,
  spiritual_effect, spiritual_duration, ghost_level_effect, destruction_percent,
  oc_name, account, phe_duyet, created_at, updated_at
)
SELECT
  cs.id, cs.name, cs.usage_detail, cs.effect, cs.tradeoff,
  cs.cong_duc_cost, cs.am_duc_cost, cs.duration,
  cs.mental_effect, cs.mental_duration, cs.health_effect, cs.health_duration,
  cs.spiritual_effect, cs.spiritual_duration, cs.ghost_level_effect, cs.destruction_percent,
  p.oc_name, p.email, 'Đã duyệt', cs.created_at, cs.updated_at
FROM public.character_skills cs
JOIN public.profiles p ON cs.user_id = p.id
WHERE cs.skill_status = 'approved'
ON CONFLICT DO NOTHING;
