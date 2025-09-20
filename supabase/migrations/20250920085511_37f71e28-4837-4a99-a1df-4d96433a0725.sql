-- Create panels table for managing corporate/TPA/insurance panels
CREATE TABLE public.panels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  panel_name TEXT NOT NULL,
  panel_code TEXT NOT NULL UNIQUE,
  person_in_charge_name TEXT,
  person_in_charge_phone TEXT,
  default_status TEXT DEFAULT 'active' CHECK (default_status IN ('active', 'inactive')),
  verification_method TEXT DEFAULT 'manual' CHECK (verification_method IN ('url', 'manual')),
  verification_url TEXT,
  manual_remarks TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create panels_price_tiers junction table for many-to-many relationship
CREATE TABLE public.panels_price_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  panel_id UUID NOT NULL REFERENCES public.panels(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.price_tiers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(panel_id, tier_id)
);

-- Enable RLS
ALTER TABLE public.panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panels_price_tiers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for panels
CREATE POLICY "Admins can manage panels" 
ON public.panels 
FOR ALL 
USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Staff can view panels" 
ON public.panels 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create RLS policies for panels_price_tiers
CREATE POLICY "Admins can manage panels price tiers" 
ON public.panels_price_tiers 
FOR ALL 
USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Staff can view panels price tiers" 
ON public.panels_price_tiers 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create trigger for updating updated_at
CREATE TRIGGER update_panels_updated_at
BEFORE UPDATE ON public.panels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_panels_panel_code ON public.panels(panel_code);
CREATE INDEX idx_panels_panel_name ON public.panels(panel_name);
CREATE INDEX idx_panels_person_in_charge ON public.panels(person_in_charge_name);
CREATE INDEX idx_panels_price_tiers_panel_id ON public.panels_price_tiers(panel_id);
CREATE INDEX idx_panels_price_tiers_tier_id ON public.panels_price_tiers(tier_id);