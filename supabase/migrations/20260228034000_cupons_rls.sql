-- Add deleted_at column for soft delete
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Enable RLS on cupons table
ALTER TABLE cupons ENABLE ROW LEVEL SECURITY;

-- Anyone can read non-deleted coupons (alunos validate codes at checkout)
CREATE POLICY "cupons_read" ON cupons
  FOR SELECT USING (deleted_at IS NULL);

-- Only admins can insert/update/delete coupons
CREATE POLICY "cupons_admin" ON cupons
  FOR ALL USING (is_admin());
