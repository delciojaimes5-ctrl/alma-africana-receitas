
-- ========== ENUMS ==========
CREATE TYPE public.app_role AS ENUM ('user', 'admin');
CREATE TYPE public.recipe_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.catalogue_type AS ENUM ('official', 'community');

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  phone TEXT,
  birth_date DATE,
  avatar_url TEXT,
  bio TEXT,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]{3,30}$')
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ========== USER ROLES ==========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ========== CATEGORIES & COUNTRIES ==========
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories readable by all" ON public.categories FOR SELECT USING (true);
CREATE POLICY "admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL
);
GRANT SELECT ON public.countries TO anon, authenticated;
GRANT ALL ON public.countries TO service_role;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "countries readable by all" ON public.countries FOR SELECT USING (true);
CREATE POLICY "admins manage countries" ON public.countries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ========== RECIPES ==========
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  category TEXT NOT NULL,
  prep_time INTEGER,
  servings INTEGER,
  image_url TEXT,
  youtube_url TEXT,
  youtube_video_id TEXT,
  status public.recipe_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  catalogue_type public.catalogue_type NOT NULL DEFAULT 'community',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX recipes_status_idx ON public.recipes(status);
CREATE INDEX recipes_catalogue_idx ON public.recipes(catalogue_type);
CREATE INDEX recipes_user_idx ON public.recipes(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipes TO authenticated;
GRANT SELECT ON public.recipes TO anon;
GRANT ALL ON public.recipes TO service_role;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- ========== INGREDIENTS ==========
CREATE TABLE public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity TEXT,
  unit TEXT,
  order_index INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX ingredients_recipe_idx ON public.ingredients(recipe_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingredients TO authenticated;
GRANT SELECT ON public.ingredients TO anon;
GRANT ALL ON public.ingredients TO service_role;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

-- ========== STEPS ==========
CREATE TABLE public.steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  description TEXT NOT NULL
);
CREATE INDEX steps_recipe_idx ON public.steps(recipe_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.steps TO authenticated;
GRANT SELECT ON public.steps TO anon;
GRANT ALL ON public.steps TO service_role;
ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;

-- ========== RECIPE LIKES ==========
CREATE TABLE public.recipe_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, recipe_id)
);
CREATE INDEX recipe_likes_recipe_idx ON public.recipe_likes(recipe_id);
GRANT SELECT, INSERT, DELETE ON public.recipe_likes TO authenticated;
GRANT SELECT ON public.recipe_likes TO anon;
GRANT ALL ON public.recipe_likes TO service_role;
ALTER TABLE public.recipe_likes ENABLE ROW LEVEL SECURITY;

-- ========== PROFILE LIKES ==========
CREATE TABLE public.profile_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (liker_id, liked_user_id),
  CONSTRAINT no_self_profile_like CHECK (liker_id <> liked_user_id)
);
CREATE INDEX profile_likes_liked_idx ON public.profile_likes(liked_user_id);
GRANT SELECT, INSERT, DELETE ON public.profile_likes TO authenticated;
GRANT SELECT ON public.profile_likes TO anon;
GRANT ALL ON public.profile_likes TO service_role;
ALTER TABLE public.profile_likes ENABLE ROW LEVEL SECURITY;

-- ========== COMMENTS ==========
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(trim(content)) > 0 AND length(content) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX comments_recipe_idx ON public.comments(recipe_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT SELECT ON public.comments TO anon;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- ========== FAVOURITES ==========
CREATE TABLE public.favourites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, recipe_id)
);
CREATE INDEX favourites_user_idx ON public.favourites(user_id);
GRANT SELECT, INSERT, DELETE ON public.favourites TO authenticated;
GRANT ALL ON public.favourites TO service_role;
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;

-- ========== NOTIFICATIONS ==========
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, is_read);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ========== TRIGGERS ==========
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER recipes_updated BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup, using metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, phone, birth_date, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'phone',
    (NEW.raw_user_meta_data->>'birth_date')::date,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (NEW.id, 'welcome', 'Bem-vindo ao Sabores de África!',
    'Estamos felizes por te ter connosco. Explora receitas tradicionais ou partilha as tuas.');
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== POLICIES ==========

-- profiles
CREATE POLICY "profiles readable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "admins manage profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "users view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- recipes: anon sees only approved official; authenticated sees approved + own
CREATE POLICY "official approved visible to all" ON public.recipes FOR SELECT
  USING (status = 'approved' AND catalogue_type = 'official');
CREATE POLICY "community approved visible to authenticated" ON public.recipes FOR SELECT TO authenticated
  USING (status = 'approved');
CREATE POLICY "users view own recipes" ON public.recipes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "admins view all recipes" ON public.recipes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users create own recipes" ON public.recipes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND catalogue_type = 'community');
CREATE POLICY "users update own recipes" ON public.recipes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own recipes" ON public.recipes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "admins manage recipes" ON public.recipes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ingredients/steps: visible if recipe is visible; managed by owner or admin
CREATE POLICY "ingredients visible with recipe" ON public.ingredients FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND (
    (r.status = 'approved' AND r.catalogue_type = 'official')
    OR (auth.uid() IS NOT NULL AND r.status = 'approved')
    OR r.user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  ))
);
CREATE POLICY "ingredients manage own" ON public.ingredients FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND (r.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND (r.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY "steps visible with recipe" ON public.steps FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND (
    (r.status = 'approved' AND r.catalogue_type = 'official')
    OR (auth.uid() IS NOT NULL AND r.status = 'approved')
    OR r.user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  ))
);
CREATE POLICY "steps manage own" ON public.steps FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND (r.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND (r.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- recipe_likes
CREATE POLICY "likes readable by all" ON public.recipe_likes FOR SELECT USING (true);
CREATE POLICY "users like recipes (not own)" ON public.recipe_likes FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid())
  );
CREATE POLICY "users unlike own" ON public.recipe_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- profile_likes
CREATE POLICY "profile likes readable by all" ON public.profile_likes FOR SELECT USING (true);
CREATE POLICY "users like profiles (not own)" ON public.profile_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = liker_id AND liker_id <> liked_user_id);
CREATE POLICY "users unlike own profile likes" ON public.profile_likes FOR DELETE TO authenticated
  USING (auth.uid() = liker_id);

-- comments
CREATE POLICY "comments readable by all" ON public.comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.status = 'approved')
);
CREATE POLICY "users comment on approved" ON public.comments FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.status = 'approved')
  );
CREATE POLICY "users delete own comments" ON public.comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- favourites
CREATE POLICY "users view own favourites" ON public.favourites FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "users add favourites" ON public.favourites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users remove favourites" ON public.favourites FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- notifications
CREATE POLICY "users view own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "users update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own notifications" ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "admins create notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ========== STORAGE ==========
INSERT INTO storage.buckets (id, name, public) VALUES ('recipe-images', 'recipe-images', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "recipe images public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-images');
CREATE POLICY "users upload recipe images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'recipe-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users update own recipe images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'recipe-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users delete own recipe images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'recipe-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
CREATE POLICY "users upload own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users update own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users delete own avatar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ========== SEEDS ==========
INSERT INTO public.categories (slug, name) VALUES
  ('pequeno-almoco', 'Pequeno-almoço'),
  ('almoco', 'Almoço'),
  ('jantar', 'Jantar'),
  ('sobremesa', 'Sobremesa'),
  ('lanche', 'Lanche'),
  ('bebida', 'Bebida');

INSERT INTO public.countries (name, region) VALUES
  ('Angola', 'África Austral'),
  ('Moçambique', 'África Austral'),
  ('Cabo Verde', 'África Ocidental'),
  ('Guiné-Bissau', 'África Ocidental'),
  ('São Tomé e Príncipe', 'África Central'),
  ('Nigéria', 'África Ocidental'),
  ('Gana', 'África Ocidental'),
  ('Senegal', 'África Ocidental'),
  ('Etiópia', 'África Oriental'),
  ('Quénia', 'África Oriental'),
  ('Marrocos', 'Norte de África'),
  ('Egipto', 'Norte de África'),
  ('África do Sul', 'África Austral');
