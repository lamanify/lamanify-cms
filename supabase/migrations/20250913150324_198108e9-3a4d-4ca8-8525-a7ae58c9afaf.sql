-- Update handle_new_user function to properly set invitation status based on signup method
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;