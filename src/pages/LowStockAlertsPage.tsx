import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, PackageX, ArrowLeft, Download, ShoppingCart, Edit } from "lucide-react";
import { useStockMovements } from "@/hooks/useStockMovements";
import { useMedications } from "@/hooks/useMedications";
import { toast } from "@/hooks/use-toast";
import { StockAdjustmentForm } from "@/components/inventory/StockAdjustmentForm";

export default function LowStockAlertsPage() {
  const navigate = useNavigate();
  const { stockMovements, loading: stockLoading } = useStockMovements();
  const { medications, loading: medLoading } = useMedications();
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [selectedMedicationId, setSelectedMedicationId] = useState<string | undefined>();

  useEffect(() => {
    if (!stockLoading && !medLoading && medications) {
      const defaultThreshold = 10;
      
      const items = medications
        .filter(med => {
          const threshold = med.reorder_level || defaultThreshold;
          return med.stock_level <= threshold;
        })
        .map(med => ({
          id: med.id,
          name: med.name,
          currentStock: med.stock_level,
          reorderLevel: med.reorder_level || defaultThreshold,
          isCustom: !!med.reorder_level,
          category: med.category,
          unitOfMeasure: med.unit_of_measure,
          averageCost: med.average_cost || 0,
          isOutOfStock: med.stock_level === 0
        }))
        .sort((a, b) => {
          if (a.isOutOfStock && !b.isOutOfStock) return -1;
          if (!a.isOutOfStock && b.isOutOfStock) return 1;
          return a.currentStock - b.currentStock;
        });

      setLowStockItems(items);
    }
  }, [medications, stockLoading, medLoading]);

  const exportToCSV = () => {
    const headers = ["Medication Name", "Current Stock", "Reorder Level", "Type", "Category", "Unit", "Est. Cost"];
    const rows = lowStockItems.map(item => [
      item.name,
      item.currentStock,
      item.reorderLevel,
      item.isCustom ? "Override" : "Default",
      item.category || "-",
      item.unitOfMeasure || "-",
      `RM ${item.averageCost.toFixed(2)}`
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `low-stock-alerts-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Low stock alerts exported to CSV",
    });
  };

  const handleQuickReorder = (medicationId: string, name: string) => {
    toast({
      title: "Reorder Initiated",
      description: `Creating purchase order for ${name}`,
    });
    navigate("/settings", { state: { tab: "inventory" } });
  };

  const handleAdjustStock = (medicationId: string) => {
    setSelectedMedicationId(medicationId);
    setAdjustmentDialogOpen(true);
  };

  const handleAdjustmentSuccess = () => {
    window.location.reload();
  };

  const loading = stockLoading || medLoading;

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
            <h1 className="text-3xl font-bold">Low Stock Alerts</h1>
            <p className="text-muted-foreground">Medications requiring attention or reorder</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={lowStockItems.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <PackageX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lowStockItems.filter(i => i.isOutOfStock).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lowStockItems.filter(i => !i.isOutOfStock).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Thresholds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lowStockItems.filter(i => i.isCustom).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Low Stock Medications</CardTitle>
          <CardDescription>
            {lowStockItems.length} medication(s) below reorder level
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading alerts...</div>
          ) : lowStockItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              All medications are adequately stocked
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Medication</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Reorder Level</TableHead>
                  <TableHead>Threshold Type</TableHead>
                  <TableHead>Est. Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.isOutOfStock ? (
                        <Badge variant="destructive" className="gap-1">
                          <PackageX className="h-3 w-3" />
                          Out
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Low
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category || "-"}</TableCell>
                    <TableCell>
                      <span className={item.isOutOfStock ? "text-destructive font-semibold" : ""}>
                        {item.currentStock} {item.unitOfMeasure}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.reorderLevel} {item.unitOfMeasure}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isCustom ? "default" : "outline"}>
                        {item.isCustom ? "Override" : "Default"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      RM {item.averageCost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdjustStock(item.id)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Adjust
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickReorder(item.id, item.name)}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Reorder
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <StockAdjustmentForm
        open={adjustmentDialogOpen}
        onOpenChange={setAdjustmentDialogOpen}
        medicationId={selectedMedicationId}
        onSuccess={handleAdjustmentSuccess}
      />
    </div>
  );
}
