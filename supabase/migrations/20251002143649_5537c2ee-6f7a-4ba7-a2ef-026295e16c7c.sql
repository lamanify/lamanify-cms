-- Phase 1: Create Secure Role Infrastructure
-- This migration addresses the privilege escalation vulnerability by moving roles
-- from the profiles table to a dedicated user_roles table with proper RLS

-- Step 1: Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    assigned_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Step 2: Create SECURITY DEFINER functions (bypass RLS to prevent recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_primary_role(_user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY assigned_at ASC
  LIMIT 1
$$;

-- Step 3: Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can manage roles (using new has_role function)
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Step 4: Migrate existing data from profiles.role to user_roles
INSERT INTO public.user_roles (user_id, role, assigned_at, assigned_by)
SELECT 
    id,
    role,
    created_at,
    NULL -- No assigned_by data for historical records
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 5: Create audit trail table for role changes
CREATE TABLE public.user_role_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    previous_role user_role,
    new_role user_role,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_user_role_audit_user_id ON public.user_role_audit(user_id);
CREATE INDEX idx_user_role_audit_changed_at ON public.user_role_audit(changed_at DESC);

-- Trigger to automatically log all role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.user_role_audit (user_id, new_role, changed_by, reason)
        VALUES (NEW.user_id, NEW.role, NEW.assigned_by, 'Role assigned');
    ELSIF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
        INSERT INTO public.user_role_audit (user_id, previous_role, new_role, changed_by, reason)
        VALUES (NEW.user_id, OLD.role, NEW.role, auth.uid(), 'Role updated');
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.user_role_audit (user_id, previous_role, new_role, changed_by, reason)
        VALUES (OLD.user_id, OLD.role, NULL, auth.uid(), 'Role removed');
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER user_roles_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_role_change();

-- Step 6: Update profiles RLS to prevent users from changing their own role
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile (non-role fields)"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
    id = auth.uid() AND
    -- Ensure role cannot be modified by user (must match current role)
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- Admins can update any profile including roles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));