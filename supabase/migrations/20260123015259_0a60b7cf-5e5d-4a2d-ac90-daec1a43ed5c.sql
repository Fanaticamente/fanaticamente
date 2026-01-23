-- Fix RLS policies for OSMF (has_role signature: has_role(_user_id uuid, _role app_role))

-- Ensure table exists
CREATE TABLE IF NOT EXISTS public.osmf_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submit_type TEXT NOT NULL,
  content TEXT NOT NULL,
  emotions TEXT[] NOT NULL DEFAULT '{}',
  club_id TEXT NULL,
  location_text TEXT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  contact_name TEXT NULL,
  contact_email TEXT NULL,
  attachment_paths TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'received'
);

ALTER TABLE public.osmf_reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'osmf_reports' AND policyname = 'OSMF reports: anyone can insert'
  ) THEN
    CREATE POLICY "OSMF reports: anyone can insert"
      ON public.osmf_reports
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'osmf_reports' AND policyname = 'OSMF reports: admin can read'
  ) THEN
    CREATE POLICY "OSMF reports: admin can read"
      ON public.osmf_reports
      FOR SELECT
      USING (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'osmf_reports' AND policyname = 'OSMF reports: admin can update'
  ) THEN
    CREATE POLICY "OSMF reports: admin can update"
      ON public.osmf_reports
      FOR UPDATE
      USING (public.has_role(auth.uid(), 'admin'::public.app_role))
      WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'osmf_reports' AND policyname = 'OSMF reports: admin can delete'
  ) THEN
    CREATE POLICY "OSMF reports: admin can delete"
      ON public.osmf_reports
      FOR DELETE
      USING (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;

-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('osmf-reports', 'osmf-reports', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'OSMF uploads: anyone can insert'
  ) THEN
    CREATE POLICY "OSMF uploads: anyone can insert"
      ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'osmf-reports');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'OSMF uploads: admin can read'
  ) THEN
    CREATE POLICY "OSMF uploads: admin can read"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'osmf-reports' AND public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'OSMF uploads: admin can delete'
  ) THEN
    CREATE POLICY "OSMF uploads: admin can delete"
      ON storage.objects
      FOR DELETE
      USING (bucket_id = 'osmf-reports' AND public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;