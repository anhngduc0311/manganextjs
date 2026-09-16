-- Extensions cho tìm kiếm tiếng Việt không dấu, typo-tolerant
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram index cho tìm kiếm không dấu siêu tốc (<15ms)
CREATE INDEX IF NOT EXISTS "comics_title_trgm_idx" ON "Comic" USING gin ("titleUnaccent" gin_trgm_ops);
