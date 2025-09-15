-- Create enum for payment methods
CREATE TYPE payment_method_type AS ENUM ('Self-Pay', 'Insurance', 'Corporate', 'Government Panel');

-- Create price_tiers table
CREATE TABLE public.price_tiers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tier_name TEXT NOT NULL,
    description TEXT,
    payment_method payment_method_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.price_tiers ENABLE ROW LEVEL SECURITY;

-- Create policies for price_tiers
CREATE POLICY "Admins can view price tiers" 
ON public.price_tiers 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Admins can create price tiers" 
ON public.price_tiers 
FOR INSERT 
WITH CHECK (get_user_role() = 'admin'::user_role);

CREATE POLICY "Admins can update price tiers" 
ON public.price_tiers 
FOR UPDATE 
USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Admins can delete price tiers" 
ON public.price_tiers 
FOR DELETE 
USING (get_user_role() = 'admin'::user_role);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_price_tiers_updated_at
BEFORE UPDATE ON public.price_tiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();