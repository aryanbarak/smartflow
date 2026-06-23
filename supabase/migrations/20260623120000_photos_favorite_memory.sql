ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS memory_date DATE;

CREATE INDEX IF NOT EXISTS idx_photos_favorite ON public.photos(user_id) WHERE is_favorite = true;
