ALTER TABLE family_children
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'child';
-- values: 'child' | 'teen' | 'adult' | 'parent'

-- Backfill existing rows with age-based defaults
UPDATE family_children
SET role = CASE
  WHEN age >= 18 THEN 'adult'
  WHEN age >= 12 THEN 'teen'
  ELSE 'child'
END
WHERE age IS NOT NULL AND (role IS NULL OR role = 'child');
