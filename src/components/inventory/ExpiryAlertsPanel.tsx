import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Clock,
  Bell,
  Package,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useMedications } from '@/hooks/useMedications';
import { format, differenceInDays, parseISO } from 'date-fns';

interface AlertItem {
  id: string;
  medication_id: string;
  medication_name: string;
  batch_number?: string;
  expiry_date: string;
  quantity: number;
  days_to_expiry: number;
  alert_type: 'expired' | 'expiring_soon' | 'low_stock' | 'out_of_stock';
  priority: 'critical' | 'high' | 'medium' | 'low';
  value: number;
}

interface ExpiryAlertsProps {
  onViewDetails?: (alertType: string) => void;
  compact?: boolean;
}

export function ExpiryAlertsPanel({ onViewDetails, compact = false }: ExpiryAlertsProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { stockMovements } = useStockMovements();
  const { medications } = useMedications();

  useEffect(() => {
    generateAlerts();
  }, [stockMovements, medications]);

  const generateAlerts = () => {
    setLoading(true);
    const alertsList: AlertItem[] = [];
    const today = new Date();

    // Process stock movements to get current inventory with expiry dates
    const inventoryMap = new Map<string, {
      medication_id: string;
      batch_number?: string;
      expiry_date: string;
      quantity: number;
      unit_cost?: number;
    }>();

    stockMovements.forEach(movement => {
      if (movement.expiry_date) {
        const key = `${movement.medication_id}-${movement.batch_number || 'no-batch'}`;
        const existing = inventoryMap.get(key);
        
        const quantityChange = ['receipt'].includes(movement.movement_type) 
          ? movement.quantity 
          : -movement.quantity;

        if (existing) {
          existing.quantity += quantityChange;
        } else {
          inventoryMap.set(key, {
            medication_id: movement.medication_id,
            batch_number: movement.batch_number,
            expiry_date: movement.expiry_date,
            quantity: quantityChange,
            unit_cost: movement.unit_cost
          });
        }
      }
    });

    // Generate expiry alerts
    inventoryMap.forEach((batch, key) => {
      if (batch.quantity > 0) {
        const medication = medications.find(m => m.id === batch.medication_id);
        const expiryDate = parseISO(batch.expiry_date);
        const daysToExpiry = differenceInDays(expiryDate, today);
        
        let alertType: AlertItem['alert_type'];
        let priority: AlertItem['priority'];

        if (daysToExpiry < 0) {
          alertType = 'expired';
          priority = 'critical';
        } else if (daysToExpiry <= 7) {
          alertType = 'expiring_soon';
          priority = 'critical';
        } else if (daysToExpiry <= 30) {
          alertType = 'expiring_soon';
          priority = 'high';
        } else if (daysToExpiry <= 90) {
          alertType = 'expiring_soon';
          priority = 'medium';
        } else {
          return; // No alert needed for items expiring > 90 days
        }

        alertsList.push({
          id: key,
          medication_id: batch.medication_id,
          medication_name: medication?.name || 'Unknown',
          batch_number: batch.batch_number,
          expiry_date: batch.expiry_date,
          quantity: batch.quantity,
          days_to_expiry: daysToExpiry,
          alert_type: alertType,
          priority,
          value: (batch.unit_cost || 0) * batch.quantity
        });
      }
    });

    // Generate stock level alerts
    medications.forEach(medication => {
      const currentStock = medication.stock_level || 0;
      
      if (currentStock === 0) {
        alertsList.push({
          id: `stock-${medication.id}`,
          medication_id: medication.id,
          medication_name: medication.name,
          expiry_date: '',
          quantity: 0,
          days_to_expiry: 0,
          alert_type: 'out_of_stock',
          priority: 'critical',
          value: 0
        });
      } else if (currentStock <= 10) { // Basic low stock threshold
        alertsList.push({
          id: `stock-${medication.id}`,
          medication_id: medication.id,
          medication_name: medication.name,
          expiry_date: '',
          quantity: currentStock,
          days_to_expiry: 0,
          alert_type: 'low_stock',
          priority: 'high',
          value: (medication.cost_price || 0) * currentStock
        });
      }
    });

    // Sort by priority and days to expiry
    alertsList.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.days_to_expiry - b.days_to_expiry;
    });

    setAlerts(alertsList);
    setLoading(false);
  };

  const getAlertIcon = (alertType: AlertItem['alert_type']) => {
    switch (alertType) {
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'expiring_soon':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'out_of_stock':
        return <Package className="h-4 w-4 text-red-600" />;
      case 'low_stock':
        return <Bell className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertBadge = (alert: AlertItem) => {
    switch (alert.alert_type) {
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'expiring_soon':
        return alert.days_to_expiry <= 7 ? 
          <Badge variant="destructive">Critical</Badge> :
          <Badge className="bg-orange-100 text-orange-800">Expiring</Badge>;
      case 'out_of_stock':
        return <Badge variant="destructive">Out of Stock</Badge>;
      case 'low_stock':
        return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
      default:
        return <Badge variant="secondary">Alert</Badge>;
    }
  };

  const getAlertMessage = (alert: AlertItem) => {
    switch (alert.alert_type) {
      case 'expired':
        return `Expired ${Math.abs(alert.days_to_expiry)} days ago`;
      case 'expiring_soon':
        return `Expires in ${alert.days_to_expiry} days`;
      case 'out_of_stock':
        return 'Out of stock';
      case 'low_stock':
        return `Low stock: ${alert.quantity} remaining`;
      default:
        return 'Requires attention';
    }
  };

  const getAlertCounts = () => {
    return {
      expired: alerts.filter(a => a.alert_type === 'expired').length,
      expiring_soon: alerts.filter(a => a.alert_type === 'expiring_soon').length,
      out_of_stock: alerts.filter(a => a.alert_type === 'out_of_stock').length,
      low_stock: alerts.filter(a => a.alert_type === 'low_stock').length,
      critical: alerts.filter(a => a.priority === 'critical').length,
    };
  };

  const alertCounts = getAlertCounts();
  const criticalAlerts = alerts.filter(a => a.priority === 'critical').slice(0, compact ? 3 : 10);

  if (compact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Stock Alerts
          </CardTitle>
          <CardDescription>Items requiring immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
              <div>
                <p className="font-medium text-red-800">Expired Items</p>
                <p className="text-sm text-red-600">Requires immediate removal</p>
              </div>
              <div className="text-2xl font-bold text-red-600">{alertCounts.expired}</div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
              <div>
                <p className="font-medium text-orange-800">Expiring Soon</p>
                <p className="text-sm text-orange-600">Within 30 days</p>
              </div>
              <div className="text-2xl font-bold text-orange-600">{alertCounts.expiring_soon}</div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
              <div>
                <p className="font-medium text-yellow-800">Low Stock</p>
                <p className="text-sm text-yellow-600">Below reorder point</p>
              </div>
              <div className="text-2xl font-bold text-yellow-600">{alertCounts.low_stock}</div>
            </div>

            {alertCounts.critical > 0 && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onViewDetails?.('critical')}
              >
                View All Critical Alerts ({alertCounts.critical})
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-red-600">{alertCounts.expired}</p>
                <p className="text-sm font-medium text-red-800">Expired Items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-orange-600">{alertCounts.expiring_soon}</p>
                <p className="text-sm font-medium text-orange-800">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-yellow-600">{alertCounts.low_stock}</p>
                <p className="text-sm font-medium text-yellow-800">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-600">{alertCounts.critical}</p>
                <p className="text-sm font-medium text-gray-800">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {criticalAlerts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Critical Alerts</CardTitle>
            <CardDescription>Items requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.map(alert => (
                <Alert key={alert.id} className="border-red-200 bg-red-50">
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.alert_type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{alert.medication_name}</p>
                        {getAlertBadge(alert)}
                      </div>
                      <AlertDescription className="mt-1">
                        {alert.batch_number && `Batch: ${alert.batch_number} • `}
                        {getAlertMessage(alert)}
                        {alert.value > 0 && ` • Value: RM ${alert.value.toFixed(2)}`}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-green-600 mb-2">All Clear!</h3>
              <p className="text-muted-foreground">No critical alerts at this time.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}