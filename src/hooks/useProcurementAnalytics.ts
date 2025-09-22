import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AnalyticsData {
  totalSpend: number;
  totalOrders: number;
  averageOrderValue: number;
  topSuppliers: SupplierPerformance[];
  spendByCategory: CategorySpend[];
  monthlyTrends: MonthlyTrend[];
  orderStatusDistribution: StatusDistribution[];
  supplierReliabilityScores: SupplierReliability[];
  costSavings: CostSavings;
  deliveryMetrics: DeliveryMetrics;
}

export interface SupplierPerformance {
  supplier_id: string;
  supplier_name: string;
  total_orders: number;
  total_spend: number;
  average_order_value: number;
  on_time_delivery_rate: number;
  quality_score: number;
  response_time_hours: number;
}

export interface CategorySpend {
  category: string;
  total_spend: number;
  order_count: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  total_spend: number;
  order_count: number;
  average_order_value: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
  total_value: number;
}

export interface SupplierReliability {
  supplier_id: string;
  supplier_name: string;
  reliability_score: number;
  total_orders: number;
  on_time_orders: number;
  late_orders: number;
  cancelled_orders: number;
}

export interface CostSavings {
  quotation_savings: number;
  bulk_order_savings: number;
  early_payment_discounts: number;
  total_savings: number;
  savings_percentage: number;
}

export interface DeliveryMetrics {
  average_delivery_time: number;
  on_time_delivery_rate: number;
  early_delivery_rate: number;
  late_delivery_rate: number;
  total_deliveries: number;
}

export function useProcurementAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAnalyticsData = async (dateRange?: { start: string; end: string }) => {
    try {
      setLoading(true);
      
      // Build date filter
      const startDate = dateRange?.start || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = dateRange?.end || new Date().toISOString().split('T')[0];

      // Fetch purchase orders with supplier data
      const { data: purchaseOrders, error: poError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers (
            id,
            supplier_name
          ),
          purchase_order_items (
            *,
            medications (
              category
            )
          )
        `)
        .gte('order_date', startDate)
        .lte('order_date', endDate);

      if (poError) throw poError;

      // Fetch quotations data
      const { data: quotations, error: quotError } = await supabase
        .from('quotations')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (quotError) throw quotError;

      // Calculate analytics
      const analytics = calculateAnalytics(purchaseOrders || [], quotations || []);
      setAnalyticsData(analytics);

    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (purchaseOrders: any[], quotations: any[]): AnalyticsData => {
    // Total spend and orders
    const totalSpend = purchaseOrders.reduce((sum, po) => sum + (po.total_amount || 0), 0);
    const totalOrders = purchaseOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalSpend / totalOrders : 0;

    // Supplier performance
    const supplierMap = new Map();
    purchaseOrders.forEach(po => {
      const supplierId = po.supplier_id;
      const supplierName = po.suppliers?.supplier_name || 'Unknown';
      
      if (!supplierMap.has(supplierId)) {
        supplierMap.set(supplierId, {
          supplier_id: supplierId,
          supplier_name: supplierName,
          total_orders: 0,
          total_spend: 0,
          on_time_orders: 0,
          total_deliveries: 0
        });
      }
      
      const supplier = supplierMap.get(supplierId);
      supplier.total_orders += 1;
      supplier.total_spend += po.total_amount || 0;
      
      // Calculate delivery metrics (mock data for now)
      if (po.status === 'received') {
        supplier.total_deliveries += 1;
        // Assume 80% on-time delivery rate
        if (Math.random() > 0.2) {
          supplier.on_time_orders += 1;
        }
      }
    });

    const topSuppliers: SupplierPerformance[] = Array.from(supplierMap.values())
      .map(supplier => ({
        ...supplier,
        average_order_value: supplier.total_orders > 0 ? supplier.total_spend / supplier.total_orders : 0,
        on_time_delivery_rate: supplier.total_deliveries > 0 ? (supplier.on_time_orders / supplier.total_deliveries) * 100 : 0,
        quality_score: 85 + Math.random() * 15, // Mock quality score
        response_time_hours: 12 + Math.random() * 48 // Mock response time
      }))
      .sort((a, b) => b.total_spend - a.total_spend)
      .slice(0, 10);

    // Category spend analysis
    const categoryMap = new Map();
    purchaseOrders.forEach(po => {
      po.purchase_order_items?.forEach((item: any) => {
        const category = item.medications?.category || 'Uncategorized';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { total_spend: 0, order_count: 0 });
        }
        const cat = categoryMap.get(category);
        cat.total_spend += item.total_cost || 0;
        cat.order_count += 1;
      });
    });

    const spendByCategory: CategorySpend[] = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        total_spend: data.total_spend,
        order_count: data.order_count,
        percentage: totalSpend > 0 ? (data.total_spend / totalSpend) * 100 : 0
      }))
      .sort((a, b) => b.total_spend - a.total_spend);

    // Monthly trends
    const monthlyMap = new Map();
    purchaseOrders.forEach(po => {
      const date = new Date(po.order_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          month: date.toLocaleString('default', { month: 'long' }),
          year: date.getFullYear(),
          total_spend: 0,
          order_count: 0
        });
      }
      
      const monthly = monthlyMap.get(key);
      monthly.total_spend += po.total_amount || 0;
      monthly.order_count += 1;
    });

    const monthlyTrends: MonthlyTrend[] = Array.from(monthlyMap.values())
      .map(trend => ({
        ...trend,
        average_order_value: trend.order_count > 0 ? trend.total_spend / trend.order_count : 0
      }))
      .sort((a, b) => new Date(`${a.year}-${a.month}`).getTime() - new Date(`${b.year}-${b.month}`).getTime());

    // Order status distribution
    const statusMap = new Map();
    purchaseOrders.forEach(po => {
      if (!statusMap.has(po.status)) {
        statusMap.set(po.status, { count: 0, total_value: 0 });
      }
      const status = statusMap.get(po.status);
      status.count += 1;
      status.total_value += po.total_amount || 0;
    });

    const orderStatusDistribution: StatusDistribution[] = Array.from(statusMap.entries())
      .map(([status, data]) => ({
        status,
        count: data.count,
        percentage: totalOrders > 0 ? (data.count / totalOrders) * 100 : 0,
        total_value: data.total_value
      }));

    // Supplier reliability scores
    const supplierReliabilityScores: SupplierReliability[] = Array.from(supplierMap.values())
      .map(supplier => {
        const reliability_score = supplier.total_deliveries > 0 
          ? (supplier.on_time_orders / supplier.total_deliveries) * 100 
          : 0;
        
        return {
          supplier_id: supplier.supplier_id,
          supplier_name: supplier.supplier_name,
          reliability_score,
          total_orders: supplier.total_orders,
          on_time_orders: supplier.on_time_orders,
          late_orders: supplier.total_deliveries - supplier.on_time_orders,
          cancelled_orders: 0 // Mock data
        };
      });

    // Cost savings analysis (mock data for now)
    const costSavings: CostSavings = {
      quotation_savings: quotations.length * 150, // Mock savings per quotation
      bulk_order_savings: totalSpend * 0.05, // 5% bulk savings
      early_payment_discounts: totalSpend * 0.02, // 2% early payment
      total_savings: 0,
      savings_percentage: 0
    };
    costSavings.total_savings = costSavings.quotation_savings + costSavings.bulk_order_savings + costSavings.early_payment_discounts;
    costSavings.savings_percentage = totalSpend > 0 ? (costSavings.total_savings / totalSpend) * 100 : 0;

    // Delivery metrics
    const completedOrders = purchaseOrders.filter(po => po.status === 'received');
    const deliveryMetrics: DeliveryMetrics = {
      average_delivery_time: 7.5, // Mock average delivery time in days
      on_time_delivery_rate: 82.5,
      early_delivery_rate: 15.2,
      late_delivery_rate: 17.5,
      total_deliveries: completedOrders.length
    };

    return {
      totalSpend,
      totalOrders,
      averageOrderValue,
      topSuppliers,
      spendByCategory,
      monthlyTrends,
      orderStatusDistribution,
      supplierReliabilityScores,
      costSavings,
      deliveryMetrics
    };
  };

  const exportAnalyticsReport = async (format: 'csv' | 'pdf' = 'csv') => {
    if (!analyticsData) return;

    try {
      const reportData = {
        summary: {
          totalSpend: analyticsData.totalSpend,
          totalOrders: analyticsData.totalOrders,
          averageOrderValue: analyticsData.averageOrderValue
        },
        topSuppliers: analyticsData.topSuppliers,
        categorySpend: analyticsData.spendByCategory,
        monthlyTrends: analyticsData.monthlyTrends,
        deliveryMetrics: analyticsData.deliveryMetrics,
        costSavings: analyticsData.costSavings
      };

      if (format === 'csv') {
        // Convert to CSV format
        const csvContent = convertToCSV(reportData);
        downloadFile(csvContent, 'procurement-analytics-report.csv', 'text/csv');
      } else {
        // For PDF, we would need a PDF generation library
        toast({
          title: 'Info',
          description: 'PDF export feature coming soon',
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to export report',
        variant: 'destructive',
      });
    }
  };

  const convertToCSV = (data: any): string => {
    // Simple CSV conversion for demonstration
    const lines = [
      'Report Section,Key,Value',
      `Summary,Total Spend,$${data.summary.totalSpend.toFixed(2)}`,
      `Summary,Total Orders,${data.summary.totalOrders}`,
      `Summary,Average Order Value,$${data.summary.averageOrderValue.toFixed(2)}`,
      '',
      'Top Suppliers',
      'Supplier Name,Total Orders,Total Spend,Average Order Value,On-Time Delivery Rate'
    ];

    data.topSuppliers.forEach((supplier: SupplierPerformance) => {
      lines.push(`${supplier.supplier_name},${supplier.total_orders},$${supplier.total_spend.toFixed(2)},$${supplier.average_order_value.toFixed(2)},${supplier.on_time_delivery_rate.toFixed(1)}%`);
    });

    return lines.join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return {
    analyticsData,
    loading,
    fetchAnalyticsData,
    exportAnalyticsReport,
  };
}