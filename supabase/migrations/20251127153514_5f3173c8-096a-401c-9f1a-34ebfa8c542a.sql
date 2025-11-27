-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create encrypted viewing keys table
CREATE TABLE public.viewing_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  key_name TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  key_type TEXT NOT NULL CHECK (key_type IN ('sapling', 'orchard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, key_name)
);

-- Enable RLS on viewing keys
ALTER TABLE public.viewing_keys ENABLE ROW LEVEL SECURITY;

-- Viewing keys policies
CREATE POLICY "Users can view own viewing keys"
  ON public.viewing_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own viewing keys"
  ON public.viewing_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own viewing keys"
  ON public.viewing_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own viewing keys"
  ON public.viewing_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Create cached blocks table (public data)
CREATE TABLE public.blocks (
  height BIGINT PRIMARY KEY,
  hash TEXT NOT NULL UNIQUE,
  version INTEGER,
  merkle_root TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  nonce TEXT,
  difficulty NUMERIC,
  size INTEGER,
  tx_count INTEGER DEFAULT 0,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on blocks (public read)
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blocks"
  ON public.blocks FOR SELECT
  USING (true);

-- Create cached transactions table (public data)
CREATE TABLE public.transactions (
  txid TEXT PRIMARY KEY,
  block_height BIGINT REFERENCES public.blocks(height) ON DELETE CASCADE,
  version INTEGER,
  locktime INTEGER,
  vin_count INTEGER DEFAULT 0,
  vout_count INTEGER DEFAULT 0,
  shielded_inputs INTEGER DEFAULT 0,
  shielded_outputs INTEGER DEFAULT 0,
  value_balance NUMERIC,
  timestamp TIMESTAMP WITH TIME ZONE,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on transactions (public read)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view transactions"
  ON public.transactions FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_blocks_timestamp ON public.blocks(timestamp DESC);
CREATE INDEX idx_blocks_hash ON public.blocks(hash);
CREATE INDEX idx_transactions_block_height ON public.transactions(block_height);
CREATE INDEX idx_transactions_timestamp ON public.transactions(timestamp DESC);
CREATE INDEX idx_viewing_keys_user_id ON public.viewing_keys(user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$;

-- Trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();