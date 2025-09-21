import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMedications } from './useMedications';

// Local type definitions until Supabase types are regenerated
export interface StockMovement {
  id: string;
  medication_id: string;
  movement_type: 'receipt' | 'dispensed' | 'adjustment' | 'expired' | 'damaged';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  reference_number?: string;
  supplier_name?: string;
  batch_number?: string;
  expiry_date?: string;
  unit_cost?: number;
  total_cost?: number;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined data
  medication?: {
    name: string;
    unit_of_measure?: string;
    cost_price?: number;
  };
  created_by_profile?: {
    first_name: string;
    last_name: string;
  };
}

export interface StockSummary {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
}

export function useStockMovements() {
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { medications, refetch: refetchMedications } = useMedications();

  const fetchStockMovements = async () => {
    try {
      setLoading(true);
      // Using type assertion to bypass TypeScript errors until types are regenerated
      const { data, error } = await (supabase as any)
        .from('stock_movements')
        .select(`
          *,
          medication:medications(name, unit_of_measure, cost_price),
          created_by_profile:profiles!stock_movements_created_by_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setStockMovements((data || []) as StockMovement[]);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch stock movements"
      });
    } finally {
      setLoading(false);
    }
  };

  const createStockMovement = async (movementData: {
    medication_id: string;
    movement_type: 'receipt' | 'dispensed' | 'adjustment' | 'expired' | 'damaged';
    quantity: number;
    reason: string;
    reference_number?: string;
    supplier_name?: string;
    batch_number?: string;
    expiry_date?: string;
    unit_cost?: number;
    notes?: string;
  }) => {
    try {
      // Get current medication stock
      const { data: currentMedication, error: medicationError } = await supabase
        .from('medications')
        .select('stock_level, cost_price')
        .eq('id', movementData.medication_id)
        .single();

      if (medicationError) throw medicationError;

      const currentStock = currentMedication.stock_level || 0;
      let newStock: number;
      
      // Calculate new stock based on movement type
      switch (movementData.movement_type) {
        case 'receipt':
        case 'adjustment':
          newStock = currentStock + movementData.quantity;
          break;
        case 'dispensed':
        case 'expired':
        case 'damaged':
          newStock = Math.max(0, currentStock - movementData.quantity);
          break;
        default:
          throw new Error('Invalid movement type');
      }

      // Validate stock levels for outgoing movements
      if (['dispensed', 'expired', 'damaged'].includes(movementData.movement_type) && 
          movementData.quantity > currentStock) {
        toast({
          variant: "destructive",
          title: "Insufficient Stock",
          description: `Cannot ${movementData.movement_type} ${movementData.quantity} units. Only ${currentStock} available.`
        });
        return false;
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Calculate costs
      const unitCost = movementData.unit_cost || currentMedication.cost_price || 0;
      const totalCost = unitCost * movementData.quantity;

      // Create stock movement record
      const { error: movementError } = await (supabase as any)
        .from('stock_movements')
        .insert([{
          medication_id: movementData.medication_id,
          movement_type: movementData.movement_type,
          quantity: movementData.quantity,
          previous_stock: currentStock,
          new_stock: newStock,
          reason: movementData.reason,
          reference_number: movementData.reference_number,
          supplier_name: movementData.supplier_name,
          batch_number: movementData.batch_number,
          expiry_date: movementData.expiry_date,
          unit_cost: unitCost,
          total_cost: totalCost,
          notes: movementData.notes,
          created_by: user.user.id
        }]);

      if (movementError) throw movementError;

      // Update medication stock level
      const { error: updateError } = await supabase
        .from('medications')
        .update({ stock_level: newStock })
        .eq('id', movementData.medication_id);

      if (updateError) throw updateError;

      // Refresh data
      await Promise.all([
        fetchStockMovements(),
        refetchMedications()
      ]);

      toast({
        title: "Success",
        description: `Stock movement recorded successfully. New stock: ${newStock}`
      });

      return true;
    } catch (error) {
      console.error('Error creating stock movement:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record stock movement"
      });
      return false;
    }
  };

  const getStockSummary = (): StockSummary => {
    const totalItems = medications.length;
    const lowStockCount = medications.filter(med => (med.stock_level || 0) > 0 && (med.stock_level || 0) <= 10).length;
    const outOfStockCount = medications.filter(med => (med.stock_level || 0) === 0).length;
    const totalValue = medications.reduce((sum, med) => {
      const stock = med.stock_level || 0;
      const cost = med.cost_price || 0;
      return sum + (stock * cost);
    }, 0);

    return {
      totalItems,
      lowStockCount,
      outOfStockCount,
      totalValue
    };
  };

  const getStockHistory = async (medicationId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('stock_movements')
        .select(`
          *,
          created_by_profile:profiles!stock_movements_created_by_fkey(first_name, last_name)
        `)
        .eq('medication_id', medicationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StockMovement[];
    } catch (error) {
      console.error('Error fetching stock history:', error);
      return [];
    }
  };

  const updateStockLevel = async (medicationId: string, newStockLevel: number, reason: string) => {
    try {
      const { data: currentMedication } = await supabase
        .from('medications')
        .select('stock_level')
        .eq('id', medicationId)
        .single();

      if (!currentMedication) return false;

      const currentStock = currentMedication.stock_level || 0;
      const difference = newStockLevel - currentStock;
      
      if (difference === 0) return true; // No change needed

      const movementType = difference > 0 ? 'adjustment' : 'adjustment';
      const quantity = Math.abs(difference);

      return await createStockMovement({
        medication_id: medicationId,
        movement_type: movementType,
        quantity: quantity,
        reason: reason || 'Manual stock adjustment',
        notes: `Stock level adjusted from ${currentStock} to ${newStockLevel}`
      });
    } catch (error) {
      console.error('Error updating stock level:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchStockMovements();
  }, []);

  return {
    stockMovements,
    loading,
    createStockMovement,
    getStockSummary,
    getStockHistory,
    updateStockLevel,
    refetch: fetchStockMovements
  };
}