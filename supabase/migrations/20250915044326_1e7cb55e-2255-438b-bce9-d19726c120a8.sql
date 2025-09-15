-- Add patient tier assignment
ALTER TABLE public.patients 
ADD COLUMN assigned_tier_id UUID REFERENCES public.price_tiers(id),
ADD COLUMN tier_assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN tier_assigned_by UUID;

-- Update treatment_items to track tier pricing used
ALTER TABLE public.treatment_items 
ADD COLUMN tier_id_used UUID REFERENCES public.price_tiers(id),
ADD COLUMN tier_price_applied DECIMAL(10,2),
ADD COLUMN original_price DECIMAL(10,2);

-- Create an index for better performance
CREATE INDEX idx_patients_assigned_tier ON public.patients(assigned_tier_id);
CREATE INDEX idx_treatment_items_tier_used ON public.treatment_items(tier_id_used);