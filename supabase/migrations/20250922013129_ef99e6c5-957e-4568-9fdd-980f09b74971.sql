-- Phase 4: Access Control & Workflow Optimization Database Foundation (Fixed)

-- Create PO approval workflows table for value-based approval hierarchies
CREATE TABLE public.po_approval_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_name TEXT NOT NULL,
  min_order_value NUMERIC NOT NULL DEFAULT 0,
  max_order_value NUMERIC,
  required_role user_role NOT NULL,
  department TEXT,
  approval_sequence INTEGER NOT NULL DEFAULT 1,
  auto_approve_below_threshold BOOLEAN DEFAULT false,
  notification_emails TEXT[],
  escalation_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create PO templates table for recurring orders
CREATE TABLE public.po_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  description TEXT,
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  department TEXT,
  template_data JSONB NOT NULL DEFAULT '{}',
  auto_generate_frequency TEXT,
  auto_generate_day INTEGER,
  next_generation_date DATE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reorder suggestions table
CREATE TABLE public.reorder_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID REFERENCES medications(id) NOT NULL,
  suggested_quantity INTEGER NOT NULL,
  current_stock INTEGER NOT NULL,
  minimum_stock_level INTEGER NOT NULL,
  average_consumption_daily NUMERIC,
  lead_time_days INTEGER DEFAULT 7,
  suggested_supplier_id UUID REFERENCES suppliers(id),
  last_order_date DATE,
  last_order_quantity INTEGER,
  priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'dismissed')),
  cost_estimate NUMERIC,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supplier catalog items table
CREATE TABLE public.supplier_catalog_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  medication_id UUID REFERENCES medications(id),
  catalog_item_code TEXT NOT NULL,
  catalog_item_name TEXT NOT NULL,
  catalog_description TEXT,
  unit_price NUMERIC NOT NULL,
  minimum_order_quantity INTEGER DEFAULT 1,
  unit_of_measure TEXT DEFAULT 'Each',
  pack_size INTEGER DEFAULT 1,
  manufacturer TEXT,
  brand_name TEXT,
  last_updated_price_date DATE DEFAULT CURRENT_DATE,
  is_available BOOLEAN DEFAULT true,
  lead_time_days INTEGER DEFAULT 7,
  catalog_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, catalog_item_code)
);

-- Enable RLS on all new tables
ALTER TABLE public.po_approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reorder_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_catalog_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for po_approval_workflows
CREATE POLICY "Admins can manage approval workflows" 
ON public.po_approval_workflows FOR ALL 
USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Staff can view approval workflows" 
ON public.po_approval_workflows FOR SELECT 
USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create RLS policies for po_templates
CREATE POLICY "Admins can manage PO templates" 
ON public.po_templates FOR ALL 
USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Staff can view and use PO templates" 
ON public.po_templates FOR SELECT 
USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can update template usage stats" 
ON public.po_templates FOR UPDATE 
USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create RLS policies for reorder_suggestions
CREATE POLICY "Admins can manage reorder suggestions" 
ON public.reorder_suggestions FOR ALL 
USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Staff can view reorder suggestions" 
ON public.reorder_suggestions FOR SELECT 
USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

CREATE POLICY "Staff can update suggestion status" 
ON public.reorder_suggestions FOR UPDATE 
USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create RLS policies for supplier_catalog_items
CREATE POLICY "Admins can manage supplier catalog" 
ON public.supplier_catalog_items FOR ALL 
USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Staff can view supplier catalog" 
ON public.supplier_catalog_items FOR SELECT 
USING (get_user_role() = ANY(ARRAY['admin'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'receptionist'::user_role]));

-- Create indexes for better performance
CREATE INDEX idx_po_approval_workflows_value_range ON po_approval_workflows(min_order_value, max_order_value);
CREATE INDEX idx_po_templates_supplier ON po_templates(supplier_id);
CREATE INDEX idx_po_templates_active ON po_templates(is_active);
CREATE INDEX idx_reorder_suggestions_medication ON reorder_suggestions(medication_id);
CREATE INDEX idx_reorder_suggestions_status ON reorder_suggestions(status);
CREATE INDEX idx_reorder_suggestions_priority ON reorder_suggestions(priority_level);
CREATE INDEX idx_supplier_catalog_supplier ON supplier_catalog_items(supplier_id);
CREATE INDEX idx_supplier_catalog_medication ON supplier_catalog_items(medication_id);

-- Create function to get user's PO approval limit
CREATE OR REPLACE FUNCTION public.get_user_po_approval_limit(user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  user_role_val user_role;
  max_limit NUMERIC := 0;
BEGIN
  SELECT role INTO user_role_val FROM profiles WHERE id = user_id;
  
  SELECT COALESCE(MAX(max_order_value), 0) INTO max_limit
  FROM po_approval_workflows 
  WHERE required_role = user_role_val 
    AND is_active = true;
  
  IF user_role_val = 'admin'::user_role THEN
    RETURN 999999999;
  END IF;
  
  RETURN COALESCE(max_limit, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to check if PO requires approval
CREATE OR REPLACE FUNCTION public.check_po_requires_approval(order_value NUMERIC, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_limit NUMERIC;
BEGIN
  user_limit := get_user_po_approval_limit(user_id);
  RETURN order_value > user_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to generate reorder suggestions
CREATE OR REPLACE FUNCTION public.generate_reorder_suggestions()
RETURNS INTEGER AS $$
DECLARE
  med_record RECORD;
  suggestion_count INTEGER := 0;
  avg_consumption NUMERIC;
  suggested_qty INTEGER;
  priority_level TEXT;
BEGIN
  DELETE FROM reorder_suggestions WHERE expires_at < now();
  
  FOR med_record IN 
    SELECT m.id, m.name, m.stock_level, m.average_cost,
           COALESCE(
             (SELECT ABS(SUM(quantity)) / 30.0 
              FROM stock_movements sm 
              WHERE sm.medication_id = m.id 
                AND sm.movement_type = 'dispensed'
                AND sm.created_at >= CURRENT_DATE - INTERVAL '30 days'), 
             0
           ) as daily_consumption
    FROM medications m
    WHERE m.stock_level <= 50 AND m.stock_level >= 0
  LOOP
    IF med_record.daily_consumption > 0 THEN
      suggested_qty := CEIL(med_record.daily_consumption * 45);
    ELSE
      suggested_qty := GREATEST(100, med_record.stock_level * 2);
    END IF;
    
    IF med_record.stock_level = 0 THEN
      priority_level := 'urgent';
    ELSIF med_record.stock_level <= 10 THEN
      priority_level := 'high';
    ELSIF med_record.stock_level <= 25 THEN
      priority_level := 'normal';
    ELSE
      priority_level := 'low';
    END IF;
    
    INSERT INTO reorder_suggestions (
      medication_id, suggested_quantity, current_stock, minimum_stock_level,
      average_consumption_daily, priority_level, reason, cost_estimate
    ) VALUES (
      med_record.id, suggested_qty, med_record.stock_level,
      CASE WHEN med_record.daily_consumption > 0 THEN CEIL(med_record.daily_consumption * 7) ELSE 50 END,
      med_record.daily_consumption, priority_level,
      CASE WHEN med_record.stock_level = 0 THEN 'out_of_stock' ELSE 'low_stock' END,
      suggested_qty * med_record.average_cost
    )
    ON CONFLICT (medication_id) WHERE status = 'pending'
    DO UPDATE SET
      suggested_quantity = EXCLUDED.suggested_quantity,
      current_stock = EXCLUDED.current_stock,
      average_consumption_daily = EXCLUDED.average_consumption_daily,
      priority_level = EXCLUDED.priority_level,
      cost_estimate = EXCLUDED.cost_estimate,
      updated_at = now();
    
    suggestion_count := suggestion_count + 1;
  END LOOP;
  
  RETURN suggestion_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_po_approval_workflows_updated_at
  BEFORE UPDATE ON po_approval_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_po_templates_updated_at
  BEFORE UPDATE ON po_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reorder_suggestions_updated_at
  BEFORE UPDATE ON reorder_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_catalog_items_updated_at
  BEFORE UPDATE ON supplier_catalog_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();