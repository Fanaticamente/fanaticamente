
-- Add receipt_number column with auto-increment
ALTER TABLE public.session_receipts ADD COLUMN IF NOT EXISTS receipt_number SERIAL;

-- Create unique index on receipt_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_receipts_receipt_number ON public.session_receipts(receipt_number);
