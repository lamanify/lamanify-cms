-- Fix critical security vulnerability: Replace insecure policies with secure ones

-- Drop all existing SELECT policies for profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view doctor profiles" ON public.profiles;

-- Create new secure policies

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

-- Policy 2: Admins can view all profiles (for user management)  
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_user_role() = 'admin'::user_role);

-- Policy 3: Staff can view doctor profiles only (for appointments/queue)
CREATE POLICY "Staff can view doctor profiles" 
ON public.profiles 
FOR SELECT 
USING (
  role = ANY(ARRAY['doctor'::user_role]) 
  AND get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role])
);