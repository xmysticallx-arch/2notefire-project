-- Update default currency to IDR (Indonesian Rupiah) across the system

-- Update transactions table default currency
ALTER TABLE public.transactions ALTER COLUMN currency SET DEFAULT 'IDR';

-- Update settings table default currency
ALTER TABLE public.settings ALTER COLUMN currency SET DEFAULT 'IDR';

-- Update existing profiles to IDR if they are set to USD (initial default)
UPDATE public.profiles 
SET currency = 'IDR', updated_at = NOW() 
WHERE currency = 'USD' OR currency IS NULL;

-- Update existing transactions to IDR if they are set to USD
UPDATE public.transactions 
SET currency = 'IDR' 
WHERE currency = 'USD' OR currency IS NULL;

-- Update existing settings to IDR if they are set to USD
UPDATE public.settings 
SET currency = 'IDR', updated_at = NOW() 
WHERE currency = 'USD' OR currency IS NULL;

-- Add currency column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='currency') THEN
    ALTER TABLE public.profiles ADD COLUMN currency TEXT DEFAULT 'IDR';
  END IF;
END $$;

-- Update contracts table default currency if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='currency') THEN
    ALTER TABLE public.contracts ALTER COLUMN currency SET DEFAULT 'IDR';
    UPDATE public.contracts SET currency = 'IDR' WHERE currency = 'USD' OR currency IS NULL;
  END IF;
END $$;

-- Update royalties table default currency if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='royalties' AND column_name='currency') THEN
    ALTER TABLE public.royalties ALTER COLUMN currency SET DEFAULT 'IDR';
    UPDATE public.royalties SET currency = 'IDR' WHERE currency = 'USD' OR currency IS NULL;
  END IF;
END $$;
