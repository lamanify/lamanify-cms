import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StockAdjustmentAudit {
  id: string;
  movement_id: string | null;
  medication_id: string;
  previous_stock: number;
  new_stock: number;
  adjustment_quantity: number;
  reason: string;
  reference_number: string | null;
  adjusted_by: string | null;
  adjusted_at: string;
  ip_address: string | null;
  user_agent: string | null;
  before_data: any;
  after_data: any;
  approval_status: string;
  approved_by: string | null;
  approved_at: string | null;
  metadata: any;
  created_at: string;
  // Joined data
  medications?: {
    name: string;
  };
}

export function useStockAdjustmentAudit() {
  const [auditLogs, setAuditLogs] = useState<StockAdjustmentAudit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = async (medicationId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from("stock_adjustment_audit")
        .select(`
          *,
          medications!inner(name)
        `)
        .order("adjusted_at", { ascending: false });

      if (medicationId) {
        query = query.eq("medication_id", medicationId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAuditLogs(data || []);
    } catch (error: any) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const getAuditSummary = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = auditLogs.filter(
      (log) => new Date(log.adjusted_at) >= today
    );

    const totalAdjustments = auditLogs.length;
    const todayAdjustments = todayLogs.length;
    const totalIncreases = auditLogs.filter(
      (log) => log.adjustment_quantity > 0
    ).length;
    const totalDecreases = auditLogs.filter(
      (log) => log.adjustment_quantity < 0
    ).length;

    return {
      totalAdjustments,
      todayAdjustments,
      totalIncreases,
      totalDecreases,
    };
  };

  return {
    auditLogs,
    loading,
    fetchAuditLogs,
    getAuditSummary,
    refetch: fetchAuditLogs,
  };
}
