-- Fix critical security vulnerability: Restrict profile access
-- Remove the overly permissive policy that allows all users to see all profiles

-- Drop the insecure policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create secure, role-based policies for profile access

-- Policy 1: Users can view their own profile (essential for user functionality)
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

-- Policy 2: Admins can view all profiles (needed for user management)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_user_role() = 'admin'::user_role);

-- Policy 3: Staff can view basic doctor information (for appointments/queue)
-- This allows staff to see doctor profiles for operational purposes
CREATE POLICY "Staff can view doctor profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- Only allow viewing doctor/admin profiles AND only by authenticated staff
  role = ANY(ARRAY['doctor'::user_role, 'admin'::user_role]) 
  AND get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role])
);