import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Supplier {
  id: string;
  supplier_name: string;
  supplier_code?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  payment_terms?: string;
  notes?: string;
  status?: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface PurchaseOrderItem {
  id?: string;
  medication_id?: string;
  item_name: string;
  quantity_ordered: number;
  quantity_received?: number;
  unit_cost: number;
  total_cost: number;
  notes?: string;
}

export interface PurchaseOrder {
  id?: string;
  po_number?: string;
  supplier_id: string;
  order_date: string;
  expected_delivery_date?: string;
  delivery_date?: string;
  status: 'draft' | 'quotation_requested' | 'quotation_received' | 'pending_approval' | 'approved' | 'ordered' | 'partially_received' | 'received' | 'closed' | 'cancelled';
  subtotal?: number;
  tax_amount?: number;
  total_amount: number;
  notes?: string;
  requested_by?: string;
  approved_by?: string;
  approved_at?: string;
  received_by?: string;
  received_at?: string;
  payment_status?: 'pending' | 'partial' | 'paid';
  payment_terms?: string;
  shipping_cost?: number;
  tracking_number?: string;
  quotation_id?: string;
  quotation_request_id?: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchaseOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(*),
          items:purchase_order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match our interface types
      const transformedData = (data || []).map(po => ({
        ...po,
        status: po.status as PurchaseOrder['status'],
        payment_status: po.payment_status as PurchaseOrder['payment_status'],
        supplier: po.supplier ? {
          ...po.supplier,
          status: (po.supplier.status || 'active') as 'active' | 'inactive'
        } : undefined
      }));
      
      setPurchaseOrders(transformedData);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast.error('Failed to load purchase orders');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('supplier_name');

      if (error) throw error;
      
      // Transform data to match our interface
      const transformedSuppliers = (data || []).map(supplier => ({
        ...supplier,
        status: 'active' as const // Default to active since we don't have status field in DB yet
      }));
      
      setSuppliers(transformedSuppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to load suppliers');
    }
  };

  const createPurchaseOrder = async (orderData: Omit<PurchaseOrder, 'id'>) => {
    try {
      // Generate PO number
      const { data: poNumberData, error: poNumberError } = await supabase
        .rpc('generate_po_number');

      if (poNumberError) throw poNumberError;

      const { data, error } = await supabase
        .from('purchase_orders')
        .insert({
          ...orderData,
          po_number: poNumberData,
          requested_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Create items if provided
      if (orderData.items && orderData.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(
            orderData.items.map(item => ({
              ...item,
              purchase_order_id: data.id
            }))
          );

        if (itemsError) throw itemsError;
      }

      toast.success('Purchase order created successfully');
      await fetchPurchaseOrders();
      return data;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast.error('Failed to create purchase order');
      throw error;
    }
  };

  const updatePurchaseOrder = async (id: string, updates: Partial<PurchaseOrder>) => {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Purchase order updated successfully');
      await fetchPurchaseOrders();
    } catch (error) {
      console.error('Error updating purchase order:', error);
      toast.error('Failed to update purchase order');
      throw error;
    }
  };

  const approvePurchaseOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'approved',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Purchase order approved successfully');
      await fetchPurchaseOrders();
    } catch (error) {
      console.error('Error approving purchase order:', error);
      toast.error('Failed to approve purchase order');
      throw error;
    }
  };

  const createSupplier = async (supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          ...supplierData,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Supplier created successfully');
      await fetchSuppliers();
      return data;
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast.error('Failed to create supplier');
      throw error;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPurchaseOrders(), fetchSuppliers()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    purchaseOrders,
    suppliers,
    loading,
    createPurchaseOrder,
    updatePurchaseOrder,
    approvePurchaseOrder,
    createSupplier,
    refetch: () => Promise.all([fetchPurchaseOrders(), fetchSuppliers()])
  };
}