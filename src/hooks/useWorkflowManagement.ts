import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Types for workflow management
export interface ApprovalWorkflow {
  id: string;
  workflow_name: string;
  min_order_value: number;
  max_order_value: number | null;
  required_role: string;
  department: string | null;
  approval_sequence: number;
  auto_approve_below_threshold: boolean;
  notification_emails: string[];
  escalation_hours: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface POTemplate {
  id: string;
  template_name: string;
  description: string | null;
  supplier_id: string;
  department: string | null;
  template_data: any;
  auto_generate_frequency: string | null;
  auto_generate_day: number | null;
  next_generation_date: string | null;
  last_used_at: string | null;
  usage_count: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  supplier_name?: string;
}

export interface ReorderSuggestion {
  id: string;
  medication_id: string;
  suggested_quantity: number;
  current_stock: number;
  minimum_stock_level: number;
  average_consumption_daily: number | null;
  lead_time_days: number;
  suggested_supplier_id: string | null;
  last_order_date: string | null;
  last_order_quantity: number | null;
  priority_level: 'low' | 'normal' | 'high' | 'urgent';
  reason: string | null;
  status: 'pending' | 'approved' | 'ordered' | 'dismissed';
  cost_estimate: number | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  medication_name?: string;
  supplier_name?: string;
}

export interface SupplierCatalogItem {
  id: string;
  supplier_id: string;
  medication_id: string | null;
  catalog_item_code: string;
  catalog_item_name: string;
  catalog_description: string | null;
  unit_price: number;
  minimum_order_quantity: number;
  unit_of_measure: string;
  pack_size: number;
  manufacturer: string | null;
  brand_name: string | null;
  last_updated_price_date: string;
  is_available: boolean;
  lead_time_days: number;
  catalog_metadata: any;
  created_at: string;
  updated_at: string;
  supplier_name?: string;
  medication_name?: string;
}

export const useWorkflowManagement = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  // State for different data types
  const [approvalWorkflows, setApprovalWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [poTemplates, setPOTemplates] = useState<POTemplate[]>([]);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [catalogItems, setCatalogItems] = useState<SupplierCatalogItem[]>([]);

  // Fetch approval workflows
  const fetchApprovalWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('po_approval_workflows')
        .select('*')
        .order('approval_sequence', { ascending: true });

      if (error) throw error;
      setApprovalWorkflows(data || []);
    } catch (error: any) {
      console.error('Error fetching approval workflows:', error);
      toast.error('Failed to fetch approval workflows');
    }
  };

  // Fetch PO templates with supplier info
  const fetchPOTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('po_templates')
        .select(`
          *,
          suppliers (
            id, name
          )
        `)
        .eq('is_active', true)
        .order('template_name', { ascending: true });

      if (error) throw error;
      
      const templatesWithSupplier = data?.map(template => ({
        ...template,
        supplier_name: template.suppliers?.name || 'Unknown'
      })) || [];

      setPOTemplates(templatesWithSupplier);
    } catch (error: any) {
      console.error('Error fetching PO templates:', error);
      toast.error('Failed to fetch PO templates');
    }
  };

  // Fetch reorder suggestions with medication and supplier info
  const fetchReorderSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('reorder_suggestions')
        .select(`
          *,
          medications (
            id, name
          ),
          suppliers (
            id, name
          )
        `)
        .neq('status', 'dismissed')
        .order('priority_level', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const suggestionsWithNames = (data || []).map((suggestion: any) => ({
        ...suggestion,
        medication_name: suggestion.medications?.name || 'Unknown',
        supplier_name: suggestion.suppliers?.name || null,
        priority_level: suggestion.priority_level as 'low' | 'normal' | 'high' | 'urgent'
      }));

      setReorderSuggestions(suggestionsWithNames);
    } catch (error: any) {
      console.error('Error fetching reorder suggestions:', error);
      toast.error('Failed to fetch reorder suggestions');
    }
  };

  // Fetch supplier catalog items
  const fetchCatalogItems = async (supplierId?: string) => {
    try {
      let query = supabase
        .from('supplier_catalog_items')
        .select(`
          *,
          suppliers (
            id, name
          ),
          medications (
            id, name
          )
        `)
        .eq('is_available', true);

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      const { data, error } = await query.order('catalog_item_name', { ascending: true });

      if (error) throw error;
      
      const itemsWithNames = data?.map(item => ({
        ...item,
        supplier_name: item.suppliers?.name || 'Unknown',
        medication_name: item.medications?.name || 'Unknown'
      })) || [];

      setCatalogItems(itemsWithNames);
    } catch (error: any) {
      console.error('Error fetching catalog items:', error);
      toast.error('Failed to fetch catalog items');
    }
  };

  // Create or update approval workflow
  const saveApprovalWorkflow = async (workflow: Omit<ApprovalWorkflow, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('po_approval_workflows')
        .insert({
          workflow_name: workflow.workflow_name,
          min_order_value: workflow.min_order_value,
          max_order_value: workflow.max_order_value,
          required_role: workflow.required_role as any,
          department: workflow.department,
          approval_sequence: workflow.approval_sequence,
          auto_approve_below_threshold: workflow.auto_approve_below_threshold,
          notification_emails: workflow.notification_emails,
          escalation_hours: workflow.escalation_hours,
          is_active: workflow.is_active,
          created_by: profile?.id
        });

      if (error) throw error;
      
      toast.success('Approval workflow created successfully');
      await fetchApprovalWorkflows();
      return true;
    } catch (error: any) {
      console.error('Error saving approval workflow:', error);
      toast.error('Failed to save approval workflow');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Create PO template
  const createPOTemplate = async (template: Omit<POTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'last_used_at'>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('po_templates')
        .insert({
          ...template,
          created_by: profile?.id,
          usage_count: 0
        });

      if (error) throw error;
      
      toast.success('PO template created successfully');
      await fetchPOTemplates();
      return true;
    } catch (error: any) {
      console.error('Error creating PO template:', error);
      toast.error('Failed to create PO template');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Use PO template (increment usage count and update last used)
  const usePOTemplate = async (templateId: string) => {
    try {
      // First get current usage count
      const { data: currentTemplate } = await supabase
        .from('po_templates')
        .select('usage_count')
        .eq('id', templateId)
        .single();

      const { error } = await supabase
        .from('po_templates')
        .update({
          usage_count: (currentTemplate?.usage_count || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', templateId);

      if (error) throw error;
      
      await fetchPOTemplates();
    } catch (error: any) {
      console.error('Error updating template usage:', error);
    }
  };

  // Update reorder suggestion status
  const updateSuggestionStatus = async (suggestionId: string, status: ReorderSuggestion['status']) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('reorder_suggestions')
        .update({ status })
        .eq('id', suggestionId);

      if (error) throw error;
      
      toast.success(`Suggestion ${status} successfully`);
      await fetchReorderSuggestions();
      return true;
    } catch (error: any) {
      console.error('Error updating suggestion status:', error);
      toast.error('Failed to update suggestion status');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Generate new reorder suggestions
  const generateReorderSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('generate_reorder_suggestions');

      if (error) throw error;
      
      toast.success(`Generated ${data || 0} new reorder suggestions`);
      await fetchReorderSuggestions();
      return data || 0;
    } catch (error: any) {
      console.error('Error generating reorder suggestions:', error);
      toast.error('Failed to generate reorder suggestions');
      return 0;
    } finally {
      setLoading(false);
    }
  };

  // Check user's PO approval limit
  const checkApprovalLimit = async (orderValue: number) => {
    try {
      const { data, error } = await supabase.rpc('check_po_requires_approval', {
        order_value: orderValue,
        user_id: profile?.id
      });

      if (error) throw error;
      return data; // Returns boolean - true if approval required
    } catch (error: any) {
      console.error('Error checking approval limit:', error);
      return true; // Default to requiring approval if error
    }
  };

  // Get user's approval limit
  const getApprovalLimit = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_po_approval_limit', {
        user_id: profile?.id
      });

      if (error) throw error;
      return data || 0;
    } catch (error: any) {
      console.error('Error getting approval limit:', error);
      return 0;
    }
  };

  // Add catalog item
  const addCatalogItem = async (item: Omit<SupplierCatalogItem, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('supplier_catalog_items')
        .insert(item);

      if (error) throw error;
      
      toast.success('Catalog item added successfully');
      await fetchCatalogItems();
      return true;
    } catch (error: any) {
      console.error('Error adding catalog item:', error);
      toast.error('Failed to add catalog item');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (profile) {
      fetchApprovalWorkflows();
      fetchPOTemplates();
      fetchReorderSuggestions();
      fetchCatalogItems();
    }
  }, [profile]);

  return {
    // Data
    approvalWorkflows,
    poTemplates,
    reorderSuggestions,
    catalogItems,
    loading,

    // Functions
    fetchApprovalWorkflows,
    fetchPOTemplates,
    fetchReorderSuggestions,
    fetchCatalogItems,
    saveApprovalWorkflow,
    createPOTemplate,
    usePOTemplate,
    updateSuggestionStatus,
    generateReorderSuggestions,
    checkApprovalLimit,
    getApprovalLimit,
    addCatalogItem,
    
    // Refresh all data
    refetch: () => {
      fetchApprovalWorkflows();
      fetchPOTemplates();
      fetchReorderSuggestions();
      fetchCatalogItems();
    }
  };
};