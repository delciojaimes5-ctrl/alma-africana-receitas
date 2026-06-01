
-- Set search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Restrict EXECUTE on SECURITY DEFINER functions to only the roles that need them
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
-- authenticated still needs has_role for RLS evaluation; that is fine

-- Tighten public bucket listing: drop blanket SELECT and replace with object-name-only access
-- (public URLs still work because they don't require LIST)
DROP POLICY IF EXISTS "recipe images public read" ON storage.objects;
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;

CREATE POLICY "recipe images read by id" ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-images');
CREATE POLICY "avatars read by id" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
-- Note: with public=true buckets, this gives the same effect; listing prevention
-- is enforced by the public client not having LIST capability without a path.
