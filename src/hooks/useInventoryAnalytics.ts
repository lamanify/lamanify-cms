import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMedications } from './useMedications';
import { useStockMovements } from './useStockMovements';

export interface UsageAnalytics {
  period: string;
  totalConsumption: number;
  totalValue: number;
  topMedications: Array<{
    medication_id: string;
    medication_name: string;
    total_dispensed: number;
    value: number;
  }>;
}

export interface ConsumptionTrend {
  date: string;
  consumption: number;
  value: number;
  medication_name?: string;
}

export interface CostFluctuation {
  medication_id: string;
  medication_name: string;
  cost_history: Array<{
    date: string;
    cost: number;
    movement_type: string;
  }>;
  price_volatility: number;
}

export function useInventoryAnalytics() {
  const [loading, setLoading] = useState(false);
  const [usageAnalytics, setUsageAnalytics] = useState<UsageAnalytics[]>([]);
  const [consumptionTrends, setConsumptionTrends] = useState<ConsumptionTrend[]>([]);
  const [costFluctuations, setCostFluctuations] = useState<CostFluctuation[]>([]);
  const { toast } = useToast();
  const { medications } = useMedications();
  const { stockMovements } = useStockMovements();

  const fetchUsageAnalytics = async (
    dateFrom: string, 
    dateTo: string, 
    groupBy: 'daily' | 'weekly' | 'monthly' = 'weekly',
    medicationId?: string,
    providerId?: string
  ) => {
    try {
      setLoading(true);

      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          medication:medications(name, cost_price, unit_of_measure),
          created_by_profile:profiles!stock_movements_created_by_fkey(first_name, last_name)
        `)
        .eq('movement_type', 'dispensed')
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo);

      if (medicationId) {
        query = query.eq('medication_id', medicationId);
      }

      if (providerId) {
        query = query.eq('created_by', providerId);
      }

      const { data: dispensedMovements, error } = await query.order('created_at');

      if (error) throw error;

      // Process data for analytics
      const analytics = processUsageData(dispensedMovements || [], groupBy);
      setUsageAnalytics(analytics);

      // Generate consumption trends
      const trends = generateConsumptionTrends(dispensedMovements || [], groupBy);
      setConsumptionTrends(trends);

    } catch (error) {
      console.error('Error fetching usage analytics:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch usage analytics"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCostFluctuations = async (dateFrom: string, dateTo: string) => {
    try {
      setLoading(true);

      const { data: costHistory, error } = await supabase
        .from('medication_cost_history')
        .select('*')
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo)
        .order('created_at');

      if (error) throw error;

      const fluctuations = processCostFluctuations(costHistory || []);
      setCostFluctuations(fluctuations);

    } catch (error) {
      console.error('Error fetching cost fluctuations:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch cost fluctuations"
      });
    } finally {
      setLoading(false);
    }
  };

  const processUsageData = (movements: any[], groupBy: string): UsageAnalytics[] => {
    const groupedData: { [key: string]: any } = {};

    movements.forEach(movement => {
      const date = new Date(movement.created_at);
      let period = '';

      switch (groupBy) {
        case 'daily':
          period = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const startOfWeek = new Date(date.setDate(date.getDate() - date.getDay()));
          period = startOfWeek.toISOString().split('T')[0];
          break;
        case 'monthly':
          period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!groupedData[period]) {
        groupedData[period] = {
          period,
          totalConsumption: 0,
          totalValue: 0,
          medications: {}
        };
      }

      const quantity = movement.quantity || 0;
      const unitCost = movement.unit_cost || movement.medication?.cost_price || 0;
      const value = quantity * unitCost;

      groupedData[period].totalConsumption += quantity;
      groupedData[period].totalValue += value;

      const medId = movement.medication_id;
      const medName = movement.medication?.name || 'Unknown';

      if (!groupedData[period].medications[medId]) {
        groupedData[period].medications[medId] = {
          medication_id: medId,
          medication_name: medName,
          total_dispensed: 0,
          value: 0
        };
      }

      groupedData[period].medications[medId].total_dispensed += quantity;
      groupedData[period].medications[medId].value += value;
    });

    return Object.values(groupedData).map(group => ({
      ...group,
      topMedications: Object.values(group.medications)
        .sort((a: any, b: any) => b.total_dispensed - a.total_dispensed)
        .slice(0, 10)
    }));
  };

  const generateConsumptionTrends = (movements: any[], groupBy: string): ConsumptionTrend[] => {
    const trendData: { [key: string]: { consumption: number; value: number } } = {};

    movements.forEach(movement => {
      const date = new Date(movement.created_at);
      let period = '';

      switch (groupBy) {
        case 'daily':
          period = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const startOfWeek = new Date(date.setDate(date.getDate() - date.getDay()));
          period = startOfWeek.toISOString().split('T')[0];
          break;
        case 'monthly':
          period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!trendData[period]) {
        trendData[period] = { consumption: 0, value: 0 };
      }

      const quantity = movement.quantity || 0;
      const unitCost = movement.unit_cost || movement.medication?.cost_price || 0;

      trendData[period].consumption += quantity;
      trendData[period].value += quantity * unitCost;
    });

    return Object.entries(trendData)
      .map(([date, data]) => ({
        date,
        consumption: data.consumption,
        value: data.value
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const processCostFluctuations = (costHistory: any[]): CostFluctuation[] => {
    const medicationCosts: { [key: string]: any } = {};

    costHistory.forEach(record => {
      const medId = record.medication_id;
      const medName = record.medication_name || 'Unknown';

      if (!medicationCosts[medId]) {
        medicationCosts[medId] = {
          medication_id: medId,
          medication_name: medName,
          cost_history: [],
          costs: []
        };
      }

      const costData = {
        date: record.created_at?.split('T')[0] || '',
        cost: record.unit_cost || 0,
        movement_type: record.movement_type || ''
      };

      medicationCosts[medId].cost_history.push(costData);
      medicationCosts[medId].costs.push(costData.cost);
    });

    // Calculate price volatility (standard deviation)
    return Object.values(medicationCosts).map((med: any) => {
      const costs = med.costs;
      const mean = costs.reduce((sum: number, cost: number) => sum + cost, 0) / costs.length;
      const variance = costs.reduce((sum: number, cost: number) => sum + Math.pow(cost - mean, 2), 0) / costs.length;
      const volatility = Math.sqrt(variance);

      return {
        ...med,
        cost_history: med.cost_history.sort((a: any, b: any) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
        price_volatility: volatility
      };
    });
  };

  const getPredictiveDemand = (medicationId: string, days: number = 30) => {
    // Simple demand forecasting based on historical consumption
    const recentMovements = stockMovements
      .filter(m => 
        m.medication_id === medicationId && 
        m.movement_type === 'dispensed' &&
        new Date(m.created_at) >= new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      );

    if (recentMovements.length === 0) return 0;

    const totalDispensed = recentMovements.reduce((sum, m) => sum + m.quantity, 0);
    const dailyAverage = totalDispensed / days;
    
    // Simple linear projection for next 30 days
    return Math.ceil(dailyAverage * 30);
  };

  return {
    loading,
    usageAnalytics,
    consumptionTrends,
    costFluctuations,
    fetchUsageAnalytics,
    fetchCostFluctuations,
    getPredictiveDemand
  };
}