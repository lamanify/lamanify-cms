import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CostHistoryEntry {
  id: string;
  medication_id: string;
  medication_name: string;
  movement_type: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  cost_per_unit_before: number;
  cost_per_unit_after: number;
  previous_stock: number;
  new_stock: number;
  batch_number?: string;
  expiry_date?: string;
  notes?: string;
  created_at: string;
  created_by_name?: string;
}

export function useCostHistory() {
  const [costHistory, setCostHistory] = useState<CostHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCostHistory = async (medicationId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('medication_cost_history')
        .select('*');
      
      if (medicationId) {
        query = query.eq('medication_id', medicationId);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCostHistory(data || []);
    } catch (error) {
      console.error('Error fetching cost history:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch cost history"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateHistoricalCost = async (movementId: string, newUnitCost: number) => {
    try {
      // Update the historical record
      const { error: updateError } = await supabase
        .from('stock_movements')
        .update({ 
          unit_cost: newUnitCost,
          total_cost: 0 // Will be recalculated
        })
        .eq('id', movementId);

      if (updateError) throw updateError;

      // Recalculate average costs for affected medication
      const movement = costHistory.find(entry => entry.id === movementId);
      if (movement) {
        await recalculateAverageCosts(movement.medication_id);
      }

      await fetchCostHistory();
      
      toast({
        title: "Success",
        description: "Cost updated and average costs recalculated"
      });

      return true;
    } catch (error) {
      console.error('Error updating historical cost:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update historical cost"
      });
      return false;
    }
  };

  const recalculateAverageCosts = async (medicationId: string) => {
    try {
      // Get all purchase movements for this medication in chronological order
      const { data: movements, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('medication_id', medicationId)
        .eq('movement_type', 'receipt')
        .order('created_at', { ascending: true });

      if (error) throw error;

      let runningStock = 0;
      let runningAverageCost = 0;

      // Recalculate step by step
      for (const movement of movements) {
        const quantity = movement.quantity || 0;
        const unitCost = movement.unit_cost || 0;

        if (runningStock === 0) {
          runningAverageCost = unitCost;
        } else {
          const totalValue = (runningStock * runningAverageCost) + (quantity * unitCost);
          const newTotalQuantity = runningStock + quantity;
          runningAverageCost = newTotalQuantity > 0 ? totalValue / newTotalQuantity : runningAverageCost;
        }

        runningStock += quantity;

        // Update the movement with recalculated costs
        await supabase
          .from('stock_movements')
          .update({
            cost_per_unit_after: runningAverageCost,
            total_cost: quantity * unitCost
          })
          .eq('id', movement.id);
      }

      // Update the medication's current average cost
      await supabase
        .from('medications')
        .update({ average_cost: runningAverageCost })
        .eq('id', medicationId);

    } catch (error) {
      console.error('Error recalculating average costs:', error);
    }
  };

  useEffect(() => {
    fetchCostHistory();
  }, []);

  return {
    costHistory,
    loading,
    fetchCostHistory,
    updateHistoricalCost,
    recalculateAverageCosts,
    refetch: fetchCostHistory
  };
}