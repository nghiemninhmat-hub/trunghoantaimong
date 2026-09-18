-- Fix tag delimiter: tags were stored comma-delimited, but "Hoa mắt, choáng váng"
-- contains a comma, causing it to split into invalid fragments on read.
-- Convert all character_skills tag columns to semicolon-delimited and deduplicate.

-- Helper: normalize a tag string
-- 1. Temporarily protect "Hoa mắt, choáng váng" (the only valid tag containing a comma)
-- 2. Replace remaining ", " delimiters with "; "
-- 3. Restore the protected tag
-- 4. Deduplicate entries
CREATE OR REPLACE FUNCTION public.normalize_tags(raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_text text;
  v_parts text[];
  v_unique text[];
  v_part text;
  v_result text;
BEGIN
  IF raw IS NULL OR btrim(raw) = '' THEN
    RETURN COALESCE(raw, '');
  END IF;

  v_text := raw;

  -- Protect the only valid tag that contains a comma
  v_text := replace(v_text, 'Hoa mắt, choáng váng', '␤HMCV␤');

  -- Now all remaining commas are delimiters -> replace with semicolons
  v_text := replace(v_text, ', ', ';');
  v_text := replace(v_text, ',', ';');

  -- Restore the protected tag
  v_text := replace(v_text, '␤HMCV␤', 'Hoa mắt, choáng váng');

  -- Split on semicolon, trim, deduplicate (preserve order)
  v_parts := string_to_array(v_text, ';');
  v_unique := ARRAY[]::text[];

  FOREACH v_part IN ARRAY v_parts
  LOOP
    v_part := btrim(v_part);
    IF v_part <> '' AND NOT (v_part = ANY(v_unique)) THEN
      v_unique := array_append(v_unique, v_part);
    END IF;
  END LOOP;

  v_result := array_to_string(v_unique, '; ');

  RETURN v_result;
END;
$$;

-- Apply to all character_skills tag columns
UPDATE character_skills
SET mental_effect = public.normalize_tags(mental_effect)
WHERE mental_effect IS NOT NULL AND mental_effect <> '';

UPDATE character_skills
SET health_effect = public.normalize_tags(health_effect)
WHERE health_effect IS NOT NULL AND health_effect <> '';

UPDATE character_skills
SET spiritual_effect = public.normalize_tags(spiritual_effect)
WHERE spiritual_effect IS NOT NULL AND spiritual_effect <> '';

-- Also check skill_templates for the same issue
UPDATE skill_templates
SET mental_effect = public.normalize_tags(mental_effect)
WHERE mental_effect IS NOT NULL AND mental_effect <> '';

UPDATE skill_templates
SET health_effect = public.normalize_tags(health_effect)
WHERE health_effect IS NOT NULL AND health_effect <> '';

UPDATE skill_templates
SET spiritual_effect = public.normalize_tags(spiritual_effect)
WHERE spiritual_effect IS NOT NULL AND spiritual_effect <> '';

-- Drop the helper function (no longer needed)
DROP FUNCTION public.normalize_tags(text);
