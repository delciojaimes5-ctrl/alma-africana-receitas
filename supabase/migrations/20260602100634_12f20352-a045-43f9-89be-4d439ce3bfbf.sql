
DO $$
BEGIN
  -- recipes
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='recipes_user_id_fkey') THEN
    ALTER TABLE public.recipes ADD CONSTRAINT recipes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='comments_user_id_fkey') THEN
    ALTER TABLE public.comments ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='comments_recipe_id_fkey') THEN
    ALTER TABLE public.comments ADD CONSTRAINT comments_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='favourites_user_id_fkey') THEN
    ALTER TABLE public.favourites ADD CONSTRAINT favourites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='favourites_recipe_id_fkey') THEN
    ALTER TABLE public.favourites ADD CONSTRAINT favourites_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='recipe_likes_user_id_fkey') THEN
    ALTER TABLE public.recipe_likes ADD CONSTRAINT recipe_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='recipe_likes_recipe_id_fkey') THEN
    ALTER TABLE public.recipe_likes ADD CONSTRAINT recipe_likes_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profile_likes_liker_id_fkey') THEN
    ALTER TABLE public.profile_likes ADD CONSTRAINT profile_likes_liker_id_fkey FOREIGN KEY (liker_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profile_likes_liked_user_id_fkey') THEN
    ALTER TABLE public.profile_likes ADD CONSTRAINT profile_likes_liked_user_id_fkey FOREIGN KEY (liked_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ingredients_recipe_id_fkey') THEN
    ALTER TABLE public.ingredients ADD CONSTRAINT ingredients_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='steps_recipe_id_fkey') THEN
    ALTER TABLE public.steps ADD CONSTRAINT steps_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='notifications_user_id_fkey') THEN
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  -- Unique constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profiles_username_key') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='recipe_likes_unique') THEN
    ALTER TABLE public.recipe_likes ADD CONSTRAINT recipe_likes_unique UNIQUE (user_id, recipe_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profile_likes_unique') THEN
    ALTER TABLE public.profile_likes ADD CONSTRAINT profile_likes_unique UNIQUE (liker_id, liked_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='favourites_unique') THEN
    ALTER TABLE public.favourites ADD CONSTRAINT favourites_unique UNIQUE (user_id, recipe_id);
  END IF;
END $$;

-- Notification trigger on recipe status change
CREATE OR REPLACE FUNCTION public.notify_recipe_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (NEW.user_id, 'recipe_approved', 'A tua receita foi aprovada!',
        'A receita "' || NEW.title || '" já está disponível na comunidade.',
        '/receita/' || NEW.id);
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (NEW.user_id, 'recipe_rejected', 'A tua receita foi rejeitada',
        COALESCE('Motivo: ' || NEW.rejection_reason, 'A receita "' || NEW.title || '" não foi aprovada.'),
        '/minhas-receitas');
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_recipe_status_change ON public.recipes;
CREATE TRIGGER trg_recipe_status_change
AFTER UPDATE ON public.recipes
FOR EACH ROW EXECUTE FUNCTION public.notify_recipe_status_change();

DROP TRIGGER IF EXISTS trg_recipes_updated_at ON public.recipes;
CREATE TRIGGER trg_recipes_updated_at BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Promote admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'delciojaimes5@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
