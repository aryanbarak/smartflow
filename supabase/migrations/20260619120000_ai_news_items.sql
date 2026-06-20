-- AI news items — global table (not user-specific).
-- Holds the latest batch of AI/tech headlines fetched daily by the agent worker.
-- Fully replaced each run (DELETE all + INSERT new batch, typically 3-5 rows).

CREATE TABLE public.ai_news_items (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  summary      TEXT,
  source       TEXT        NOT NULL,
  url          TEXT        NOT NULL,
  published_at TIMESTAMPTZ,
  fetched_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ai_news_items_fetched_at_idx ON public.ai_news_items (fetched_at DESC);

ALTER TABLE public.ai_news_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read news"
  ON public.ai_news_items
  FOR SELECT
  TO authenticated
  USING (true);
