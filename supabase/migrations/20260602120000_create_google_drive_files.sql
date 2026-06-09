-- Migration to Create google_drive_files metadata tracking table
CREATE TABLE IF NOT EXISTS public.google_drive_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id TEXT NOT NULL UNIQUE, -- ID do arquivo no Google Drive
    name TEXT NOT NULL,
    mime_type TEXT,
    size BIGINT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
    error_message TEXT,
    extracted_notes_count INTEGER DEFAULT 0,
    processed_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.google_drive_files ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can select google_drive_files"
ON public.google_drive_files FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert google_drive_files"
ON public.google_drive_files FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update google_drive_files"
ON public.google_drive_files FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete google_drive_files"
ON public.google_drive_files FOR DELETE
TO authenticated
USING (true);

-- Grant privileges
GRANT ALL ON public.google_drive_files TO authenticated;
GRANT ALL ON public.google_drive_files TO service_role;
