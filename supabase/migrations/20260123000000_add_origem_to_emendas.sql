ALTER TABLE emendas 
ADD COLUMN IF NOT EXISTS origem TEXT NOT NULL DEFAULT 'FEDERAL' 
CHECK (origem IN ('FEDERAL', 'ESTADUAL'));

COMMENT ON COLUMN emendas.origem IS 'Distinguishes between Federal and State amendments';
