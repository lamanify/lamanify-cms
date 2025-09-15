-- Create service pricing table
CREATE TABLE public.service_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.medical_services(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.price_tiers(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_id, tier_id)
);

-- Create medication pricing table
CREATE TABLE public.medication_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.price_tiers(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(medication_id, tier_id)
);

-- Enable RLS on both tables
ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_pricing ENABLE ROW LEVEL SECURITY;

-- Create policies for service_pricing
CREATE POLICY "Admins can manage service pricing" 
ON public.service_pricing 
FOR ALL 
USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Staff can view service pricing" 
ON public.service_pricing 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create policies for medication_pricing
CREATE POLICY "Admins can manage medication pricing" 
ON public.medication_pricing 
FOR ALL 
USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Staff can view medication pricing" 
ON public.medication_pricing 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Add triggers for updated_at
CREATE TRIGGER update_service_pricing_updated_at
  BEFORE UPDATE ON public.service_pricing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medication_pricing_updated_at
  BEFORE UPDATE ON public.medication_pricing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();