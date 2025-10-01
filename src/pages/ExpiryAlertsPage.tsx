import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CalendarX, ArrowLeft, Trash2, Calendar, Edit } from "lucide-react";
import { useStockMovements } from "@/hooks/useStockMovements";
import { useMedications } from "@/hooks/useMedications";
import { toast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StockAdjustmentForm } from "@/components/inventory/StockAdjustmentForm";

interface ExpiryAlert {
  id: string;
  medicationId: string;
  medicationName: string;
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
  daysToExpiry: number;
  status: 'expired' | 'expiring_soon';
  unitOfMeasure: string;
}

export default function ExpiryAlertsPage() {
  const navigate = useNavigate();
  const { stockMovements, createStockMovement, loading: stockLoading } = useStockMovements();
  const { medications, loading: medLoading } = useMedications();
  const [expiryThreshold, setExpiryThreshold] = useState(30);
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<ExpiryAlert | null>(null);
  const [showWastageDialog, setShowWastageDialog] = useState(false);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [selectedMedicationId, setSelectedMedicationId] = useState<string | undefined>();

  useEffect(() => {
    if (!stockLoading && !medLoading && stockMovements && medications) {
      generateExpiryAlerts();
    }
  }, [stockMovements, medications, expiryThreshold, stockLoading, medLoading]);

  const generateExpiryAlerts = () => {
    const today = new Date();
    const alerts: ExpiryAlert[] = [];
    const inventoryMap = new Map<string, Map<string, { quantity: number; expiryDate: Date }>>();

    stockMovements.forEach(movement => {
      if (!movement.batch_number || !movement.expiry_date) return;

      const medId = movement.medication_id;
      if (!inventoryMap.has(medId)) {
        inventoryMap.set(medId, new Map());
      }

      const batches = inventoryMap.get(medId)!;
      const batchKey = movement.batch_number;

      if (!batches.has(batchKey)) {
        batches.set(batchKey, { quantity: 0, expiryDate: new Date(movement.expiry_date) });
      }

      const batch = batches.get(batchKey)!;
      
      if (['receipt', 'adjustment', 'stock_take'].includes(movement.movement_type) && movement.quantity > 0) {
        batch.quantity += movement.quantity;
      } else if (['dispensed', 'wastage', 'transfer_out'].includes(movement.movement_type)) {
        batch.quantity -= Math.abs(movement.quantity);
      }
    });

    inventoryMap.forEach((batches, medId) => {
      const medication = medications.find(m => m.id === medId);
      if (!medication) return;

      batches.forEach((batch, batchNumber) => {
        if (batch.quantity <= 0) return;

        const daysToExpiry = differenceInDays(batch.expiryDate, today);
        
        if (daysToExpiry < 0) {
          alerts.push({
            id: `${medId}-${batchNumber}`,
            medicationId: medId,
            medicationName: medication.name,
            batchNumber,
            expiryDate: batch.expiryDate,
            quantity: batch.quantity,
            daysToExpiry,
            status: 'expired',
            unitOfMeasure: medication.unit_of_measure || 'units'
          });
        } else if (daysToExpiry <= expiryThreshold) {
          alerts.push({
            id: `${medId}-${batchNumber}`,
            medicationId: medId,
            medicationName: medication.name,
            batchNumber,
            expiryDate: batch.expiryDate,
            quantity: batch.quantity,
            daysToExpiry,
            status: 'expiring_soon',
            unitOfMeasure: medication.unit_of_measure || 'units'
          });
        }
      });
    });

    alerts.sort((a, b) => a.daysToExpiry - b.daysToExpiry);
    setExpiryAlerts(alerts);
  };

  const handleMarkAsWastage = async () => {
    if (!selectedAlert) return;

    try {
      await createStockMovement({
        medication_id: selectedAlert.medicationId,
        movement_type: 'wastage',
        quantity: -selectedAlert.quantity,
        reason: 'Expired medication',
        batch_number: selectedAlert.batchNumber,
        expiry_date: format(selectedAlert.expiryDate, 'yyyy-MM-dd'),
        notes: `Expired on ${format(selectedAlert.expiryDate, 'MMM dd, yyyy')} - marked as wastage`
      });

      toast({
        title: "Marked as Wastage",
        description: `${selectedAlert.quantity} ${selectedAlert.unitOfMeasure} of ${selectedAlert.medicationName} (Batch: ${selectedAlert.batchNumber})`,
      });

      setShowWastageDialog(false);
      setSelectedAlert(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark as wastage",
        variant: "destructive",
      });
    }
  };

  const handleAdjustStock = (medicationId: string) => {
    setSelectedMedicationId(medicationId);
    setAdjustmentDialogOpen(true);
  };

  const handleAdjustmentSuccess = () => {
    window.location.reload();
  };

  const loading = stockLoading || medLoading;
  const expiredCount = expiryAlerts.filter(a => a.status === 'expired').length;
  const expiringSoonCount = expiryAlerts.filter(a => a.status === 'expiring_soon').length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/settings")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Expiry Management</h1>
            <p className="text-muted-foreground">Monitor and manage medication expiry dates</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="threshold">Alert Threshold (days)</Label>
            <Input
              id="threshold"
              type="number"
              value={expiryThreshold}
              onChange={(e) => setExpiryThreshold(parseInt(e.target.value) || 30)}
              className="w-20"
              min="1"
              max="365"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <CalendarX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{expiredCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{expiringSoonCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Calendar className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiryAlerts.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expiry Alerts</CardTitle>
          <CardDescription>
            Showing medications expiring within {expiryThreshold} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading alerts...</div>
          ) : expiryAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No expiring medications found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Medication</TableHead>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Days to Expiry</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiryAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      {alert.status === 'expired' ? (
                        <Badge variant="destructive" className="gap-1">
                          <CalendarX className="h-3 w-3" />
                          Expired
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 bg-warning/10 text-warning border-warning/20">
                          <AlertTriangle className="h-3 w-3" />
                          Soon
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{alert.medicationName}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {alert.batchNumber}
                      </code>
                    </TableCell>
                    <TableCell>
                      {format(alert.expiryDate, 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <span className={alert.daysToExpiry < 0 ? "text-destructive font-semibold" : ""}>
                        {alert.daysToExpiry < 0 
                          ? `${Math.abs(alert.daysToExpiry)} days ago`
                          : `${alert.daysToExpiry} days`
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      {alert.quantity} {alert.unitOfMeasure}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdjustStock(alert.medicationId)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Adjust
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAlert(alert);
                          setShowWastageDialog(true);
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Wastage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showWastageDialog} onOpenChange={setShowWastageDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Wastage</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a wastage stock movement for:
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <div><strong>Medication:</strong> {selectedAlert?.medicationName}</div>
                <div><strong>Batch:</strong> {selectedAlert?.batchNumber}</div>
                <div><strong>Quantity:</strong> {selectedAlert?.quantity} {selectedAlert?.unitOfMeasure}</div>
                <div><strong>Expiry Date:</strong> {selectedAlert && format(selectedAlert.expiryDate, 'MMM dd, yyyy')}</div>
              </div>
              This action will reduce the stock level and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkAsWastage}>
              Confirm Wastage
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <StockAdjustmentForm
        open={adjustmentDialogOpen}
        onOpenChange={setAdjustmentDialogOpen}
        medicationId={selectedMedicationId}
        onSuccess={handleAdjustmentSuccess}
      />
    </div>
  );
}
