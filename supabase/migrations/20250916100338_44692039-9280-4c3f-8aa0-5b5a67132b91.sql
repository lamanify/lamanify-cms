-- Add locum role to existing user_role enum
ALTER TYPE public.user_role ADD VALUE 'locum';

-- Create user permissions table for fine-grained control
CREATE TABLE public.user_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    permission_type VARCHAR(50) NOT NULL,
    permission_value BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, permission_type)
);

-- Enable RLS on user permissions
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_permissions
CREATE POLICY "Admins can manage user permissions" 
ON public.user_permissions 
FOR ALL 
USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Users can view own permissions" 
ON public.user_permissions 
FOR SELECT 
USING (user_id = auth.uid());

-- Add phone column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Create trigger for updating user_permissions timestamps
CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON public.user_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();