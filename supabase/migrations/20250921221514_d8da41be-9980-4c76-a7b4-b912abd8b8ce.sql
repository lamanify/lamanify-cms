-- Fix remaining function search path security warnings

-- Fix update_updated_at_column function  
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    user_count INTEGER;
    inviter_id UUID;
BEGIN
    -- Count existing profiles to determine if this is the first user
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    
    -- Check if this user was invited by extracting inviter from metadata
    inviter_id := (NEW.raw_user_meta_data->>'invited_by')::UUID;
    
    -- Insert new profile
    INSERT INTO public.profiles (
        id, 
        first_name, 
        last_name, 
        email, 
        role,
        status,
        invitation_status,
        invited_by,
        invited_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        CASE 
            WHEN user_count = 0 THEN 'admin'::user_role  -- First user becomes admin
            ELSE COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'receptionist'::user_role)
        END,
        'active',
        CASE 
            WHEN inviter_id IS NOT NULL THEN 'accepted'
            ELSE 'accepted'  -- Direct signup is considered accepted
        END,
        inviter_id,
        CASE 
            WHEN inviter_id IS NOT NULL THEN now()
            ELSE NULL
        END
    );
    RETURN NEW;
END;
$function$;

-- Fix get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;