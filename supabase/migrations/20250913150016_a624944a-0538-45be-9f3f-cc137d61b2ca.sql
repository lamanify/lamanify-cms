-- Update the handle_new_user function to set the first user as admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Count existing profiles to determine if this is the first user
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    
    -- Insert new profile
    INSERT INTO public.profiles (id, first_name, last_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        CASE 
            WHEN user_count = 0 THEN 'admin'::user_role  -- First user becomes admin
            ELSE 'receptionist'::user_role              -- Default role for others
        END
    );
    RETURN NEW;
END;
$$;