-- Add invitation status tracking and user status to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
ADD COLUMN IF NOT EXISTS invitation_status TEXT DEFAULT 'accepted' CHECK (invitation_status IN ('pending', 'accepted', 'expired')),
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;