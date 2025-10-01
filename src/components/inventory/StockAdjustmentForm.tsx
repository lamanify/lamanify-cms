import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Calculator } from "lucide-react";
import { useMedications } from "@/hooks/useMedications";
import { useStockMovements } from "@/hooks/useStockMovements";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { toast } from "sonner";

interface StockAdjustmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicationId?: string;
  onSuccess?: () => void;
}

interface AdjustmentFormData {
  medicationId: string;
  actualStock: number;
  reason: string;
  reasonCode: string;
  referenceNumber?: string;
  notes?: string;
}

const REASON_CODES = [
  { value: "count_error", label: "Count Error/Discrepancy" },
  { value: "damaged", label: "Damaged Stock" },
  { value: "expired", label: "Expired Items" },
  { value: "theft", label: "Theft/Loss" },
  { value: "cycle_count", label: "Cycle Count Adjustment" },
  { value: "system_error", label: "System Error Correction" },
  { value: "other", label: "Other (Specify)" },
];

export function StockAdjustmentForm({
  open,
  onOpenChange,
  medicationId,
  onSuccess,
}: StockAdjustmentFormProps) {
  const { medications } = useMedications();
  const { createStockMovement, loading: movementLoading } = useStockMovements();
  const { hasPermission } = useUserPermissions();
  const [selectedMedication, setSelectedMedication] = useState<any>(null);
  const [adjustmentDelta, setAdjustmentDelta] = useState<number>(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AdjustmentFormData>({
    defaultValues: {
      medicationId: medicationId || "",
      actualStock: 0,
      reason: "",
      reasonCode: "",
      referenceNumber: "",
      notes: "",
    },
  });

  const watchedMedicationId = watch("medicationId");
  const watchedActualStock = watch("actualStock");

  // Check permissions - admins and doctors can adjust stock
  const canAdjustStock = ["admin", "doctor"].includes(String(useUserPermissions().profile?.role));

  useEffect(() => {
    if (medicationId) {
      setValue("medicationId", medicationId);
    }
  }, [medicationId, setValue]);

  useEffect(() => {
    if (watchedMedicationId) {
      const med = medications.find((m) => m.id === watchedMedicationId);
      setSelectedMedication(med);
      if (med) {
        setValue("actualStock", med.stock_level);
      }
    }
  }, [watchedMedicationId, medications, setValue]);

  useEffect(() => {
    if (selectedMedication) {
      const systemStock = selectedMedication.stock_level;
      const actual = Number(watchedActualStock) || 0;
      const delta = actual - systemStock;
      setAdjustmentDelta(delta);
    }
  }, [watchedActualStock, selectedMedication]);

  const onSubmit = async (data: AdjustmentFormData) => {
    if (!canAdjustStock) {
      toast.error("You don't have permission to adjust stock");
      return;
    }

    if (adjustmentDelta === 0) {
      toast.error("No adjustment needed - actual stock matches system stock");
      return;
    }

    if (!selectedMedication) {
      toast.error("Please select a medication");
      return;
    }

    try {
      const reason = data.reasonCode === "other" 
        ? data.reason 
        : REASON_CODES.find(r => r.value === data.reasonCode)?.label || data.reason;

      await createStockMovement({
        medication_id: data.medicationId,
        movement_type: "adjustment",
        quantity: Math.abs(adjustmentDelta),
        reason: reason,
        reference_number: data.referenceNumber,
        notes: data.notes,
      });

      toast.success("Stock adjusted successfully");
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error adjusting stock:", error);
      toast.error(error.message || "Failed to adjust stock");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Stock Adjustment</DialogTitle>
          <DialogDescription>
            Adjust stock levels when actual counts differ from system records
          </DialogDescription>
        </DialogHeader>

        {!canAdjustStock && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to adjust stock. Please contact an administrator.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Medication Selection */}
          <div className="space-y-2">
            <Label htmlFor="medication">Medication *</Label>
            <Select
              value={watchedMedicationId}
              onValueChange={(value) => setValue("medicationId", value)}
              disabled={!!medicationId || !canAdjustStock}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select medication" />
              </SelectTrigger>
              <SelectContent>
                {medications.map((med) => (
                  <SelectItem key={med.id} value={med.id}>
                    {med.name} (Current: {med.stock_level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.medicationId && (
              <p className="text-sm text-destructive">{errors.medicationId.message}</p>
            )}
          </div>

          {selectedMedication && (
            <>
              {/* Stock Comparison */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">System Stock</Label>
                  <p className="text-2xl font-bold">{selectedMedication.stock_level}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Actual Stock *</Label>
                  <Input
                    type="number"
                    {...register("actualStock", {
                      required: "Actual stock is required",
                      min: { value: 0, message: "Stock cannot be negative" },
                    })}
                    disabled={!canAdjustStock}
                    className="text-2xl font-bold h-12"
                  />
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <Label className="text-xs text-muted-foreground">Adjustment</Label>
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-muted-foreground" />
                      <p
                        className={`text-2xl font-bold ${
                          adjustmentDelta > 0
                            ? "text-green-600"
                            : adjustmentDelta < 0
                            ? "text-red-600"
                            : ""
                        }`}
                      >
                        {adjustmentDelta > 0 ? "+" : ""}
                        {adjustmentDelta}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason Code */}
              <div className="space-y-2">
                <Label htmlFor="reasonCode">Reason Code *</Label>
                <Select
                  value={watch("reasonCode")}
                  onValueChange={(value) => setValue("reasonCode", value)}
                  disabled={!canAdjustStock}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {REASON_CODES.map((code) => (
                      <SelectItem key={code.value} value={code.value}>
                        {code.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Reason (if "Other" selected) */}
              {watch("reasonCode") === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="reason">Custom Reason *</Label>
                  <Input
                    {...register("reason", {
                      required: watch("reasonCode") === "other" ? "Reason is required" : false,
                    })}
                    placeholder="Enter reason for adjustment"
                    disabled={!canAdjustStock}
                  />
                  {errors.reason && (
                    <p className="text-sm text-destructive">{errors.reason.message}</p>
                  )}
                </div>
              )}

              {/* Reference Number */}
              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input
                  {...register("referenceNumber")}
                  placeholder="e.g., Cycle Count #2024-01"
                  disabled={!canAdjustStock}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  {...register("notes")}
                  placeholder="Any additional information about this adjustment"
                  rows={3}
                  disabled={!canAdjustStock}
                />
              </div>

              {adjustmentDelta !== 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This adjustment will {adjustmentDelta > 0 ? "increase" : "decrease"} stock by{" "}
                    {Math.abs(adjustmentDelta)} units. This action will be logged in the audit trail.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canAdjustStock || movementLoading || adjustmentDelta === 0}
            >
              {movementLoading ? "Adjusting..." : "Adjust Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
