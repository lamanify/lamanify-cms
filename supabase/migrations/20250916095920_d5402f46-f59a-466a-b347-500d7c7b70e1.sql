-- Create packages table
CREATE TABLE public.packages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    package_name VARCHAR(200) NOT NULL,
    package_price DECIMAL(10,2) NOT NULL,
    bundle_value DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

-- Create package_items table
CREATE TABLE public.package_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id UUID NOT NULL,
    item_id UUID NOT NULL, -- references either service_id or medication_id
    item_type VARCHAR(20) NOT NULL, -- 'service' or 'inventory'
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    stock_at_time_added INTEGER, -- for inventory items
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on packages table
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on package_items table
ALTER TABLE public.package_items ENABLE ROW LEVEL SECURITY;

-- Create policies for packages table
CREATE POLICY "Admins can manage packages" 
ON public.packages 
FOR ALL 
USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Staff can view packages" 
ON public.packages 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create policies for package_items table
CREATE POLICY "Admins can manage package items" 
ON public.package_items 
FOR ALL 
USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Staff can view package items" 
ON public.package_items 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create trigger for updating timestamps
CREATE TRIGGER update_packages_updated_at
BEFORE UPDATE ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();