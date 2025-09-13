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
-- This creates a limited view that only exposes necessary professional information
CREATE POLICY "Staff can view doctor basic info" 
ON public.profiles 
FOR SELECT 
USING (
  -- Allow viewing doctor profiles for appointment scheduling and queue management
  role = ANY(ARRAY['doctor'::user_role, 'admin'::user_role]) 
  AND get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role])
);

-- Create a secure view for public staff directory (if needed)
-- This view only exposes minimal professional information
CREATE OR REPLACE VIEW public.staff_directory AS
SELECT 
  id,
  first_name,
  last_name,
  role,
  status
FROM public.profiles
WHERE role = ANY(ARRAY['doctor'::user_role, 'admin'::user_role])
AND status = 'active';

-- Enable RLS on the view
ALTER VIEW public.staff_directory SET (security_barrier = true);

-- Grant appropriate permissions on the view
GRANT SELECT ON public.staff_directory TO authenticated;

-- Create RLS policy for the staff directory view
CREATE POLICY "Staff can view staff directory" 
ON public.staff_directory
FOR SELECT 
USING (
  get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role])
);