import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  Package, 
  DollarSign,
  AlertTriangle,
  BarChart3,
  FileSpreadsheet
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import * as XLSX from 'xlsx';
import { useMedications } from '@/hooks/useMedications';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useInventoryAnalytics } from '@/hooks/useInventoryAnalytics';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'stock_aging' | 'consumption' | 'cost_analysis' | 'expiry' | 'valuation' | 'turnover';
  icon: any;
  fields: string[];
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'stock_aging',
    name: 'Stock Aging Report',
    description: 'Analysis of inventory age and turnover rates',
    type: 'stock_aging',
    icon: Calendar,
    fields: ['medication_name', 'current_stock', 'last_movement_date', 'days_since_movement', 'turnover_rate']
  },
  {
    id: 'consumption_analysis',
    name: 'Consumption Analysis',
    description: 'Detailed consumption patterns and trends',
    type: 'consumption',
    icon: TrendingUp,
    fields: ['medication_name', 'total_dispensed', 'avg_daily_consumption', 'peak_consumption_day', 'trend']
  },
  {
    id: 'cost_variance',
    name: 'Cost Variance Report',
    description: 'Price fluctuations and cost analysis',
    type: 'cost_analysis',
    icon: DollarSign,
    fields: ['medication_name', 'current_cost', 'average_cost', 'cost_variance', 'price_stability']
  },
  {
    id: 'expiry_analysis',
    name: 'Expiry Analysis',
    description: 'Upcoming expirations and waste analysis',
    type: 'expiry',
    icon: AlertTriangle,
    fields: ['medication_name', 'batch_number', 'expiry_date', 'days_to_expiry', 'quantity_at_risk']
  },
  {
    id: 'inventory_valuation',
    name: 'Inventory Valuation',
    description: 'Current inventory value and composition',
    type: 'valuation',
    icon: Package,
    fields: ['medication_name', 'current_stock', 'unit_cost', 'total_value', 'percentage_of_total']
  },
  {
    id: 'turnover_analysis',
    name: 'Turnover Analysis',
    description: 'Stock turnover rates and efficiency metrics',
    type: 'turnover',
    icon: BarChart3,
    fields: ['medication_name', 'avg_stock', 'consumption_rate', 'turnover_ratio', 'reorder_frequency']
  }
];

export function InventoryReportsManager() {
  const [selectedReport, setSelectedReport] = useState<ReportTemplate | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [groupBy, setGroupBy] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');

  const { medications } = useMedications();
  const { stockMovements } = useStockMovements();
  const { usageAnalytics, fetchUsageAnalytics } = useInventoryAnalytics();

  const generateReport = async (template: ReportTemplate) => {
    setIsGenerating(true);
    
    try {
      let reportData: any[] = [];
      
      switch (template.type) {
        case 'stock_aging':
          reportData = generateStockAgingReport();
          break;
        case 'consumption':
          reportData = generateConsumptionReport();
          break;
        case 'cost_analysis':
          reportData = generateCostAnalysisReport();
          break;
        case 'expiry':
          reportData = generateExpiryReport();
          break;
        case 'valuation':
          reportData = generateValuationReport();
          break;
        case 'turnover':
          reportData = generateTurnoverReport();
          break;
      }

      exportToExcel(reportData, template.name);
      
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateStockAgingReport = () => {
    return medications.map(med => {
      const lastMovement = stockMovements
        .filter(m => m.medication_id === med.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      
      const daysSinceMovement = lastMovement ? 
        Math.floor((Date.now() - new Date(lastMovement.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 
        null;
      
      const totalDispensed = stockMovements
        .filter(m => m.medication_id === med.id && m.movement_type === 'dispensed')
        .reduce((sum, m) => sum + m.quantity, 0);
      
      const turnoverRate = (med.stock_level || 0) > 0 ? totalDispensed / (med.stock_level || 1) : 0;

      return {
        medication_name: med.name,
        current_stock: med.stock_level || 0,
        last_movement_date: lastMovement ? format(new Date(lastMovement.created_at), 'yyyy-MM-dd') : 'Never',
        days_since_movement: daysSinceMovement || 'N/A',
        turnover_rate: turnoverRate.toFixed(2)
      };
    });
  };

  const generateConsumptionReport = () => {
    return medications.map(med => {
      const dispensedMovements = stockMovements.filter(m => 
        m.medication_id === med.id && m.movement_type === 'dispensed'
      );
      
      const totalDispensed = dispensedMovements.reduce((sum, m) => sum + m.quantity, 0);
      const avgDaily = totalDispensed / 30; // Assuming 30-day period
      
      // Find peak consumption day
      const dailyConsumption: { [key: string]: number } = {};
      dispensedMovements.forEach(m => {
        const date = new Date(m.created_at).toISOString().split('T')[0];
        dailyConsumption[date] = (dailyConsumption[date] || 0) + m.quantity;
      });
      
      const peakDay = Object.entries(dailyConsumption)
        .sort(([,a], [,b]) => b - a)[0];

      return {
        medication_name: med.name,
        total_dispensed: totalDispensed,
        avg_daily_consumption: avgDaily.toFixed(2),
        peak_consumption_day: peakDay ? `${peakDay[0]} (${peakDay[1]} units)` : 'N/A',
        trend: totalDispensed > avgDaily * 20 ? 'Increasing' : 'Stable'
      };
    });
  };

  const generateCostAnalysisReport = () => {
    return medications.map(med => {
      const costHistory = stockMovements
        .filter(m => m.medication_id === med.id && m.unit_cost)
        .map(m => m.unit_cost!);
      
      const currentCost = med.cost_price || 0;
      const avgCost = costHistory.length > 0 ? 
        costHistory.reduce((sum, cost) => sum + cost, 0) / costHistory.length : 
        currentCost;
      
      const costVariance = ((currentCost - avgCost) / avgCost) * 100;
      const priceStability = Math.abs(costVariance) < 10 ? 'Stable' : 'Volatile';

      return {
        medication_name: med.name,
        current_cost: currentCost.toFixed(2),
        average_cost: avgCost.toFixed(2),
        cost_variance: `${costVariance.toFixed(2)}%`,
        price_stability: priceStability
      };
    });
  };

  const generateExpiryReport = () => {
    // This would require expiry tracking data from batch management
    // For now, return placeholder data
    return medications
      .filter(med => (med.stock_level || 0) > 0)
      .map(med => ({
        medication_name: med.name,
        batch_number: 'BATCH-001',
        expiry_date: '2024-12-31',
        days_to_expiry: 90,
        quantity_at_risk: med.stock_level || 0
      }));
  };

  const generateValuationReport = () => {
    const totalValue = medications.reduce((sum, med) => {
      const value = (med.stock_level || 0) * (med.cost_price || 0);
      return sum + value;
    }, 0);

    return medications.map(med => {
      const value = (med.stock_level || 0) * (med.cost_price || 0);
      const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;

      return {
        medication_name: med.name,
        current_stock: med.stock_level || 0,
        unit_cost: (med.cost_price || 0).toFixed(2),
        total_value: value.toFixed(2),
        percentage_of_total: `${percentage.toFixed(2)}%`
      };
    });
  };

  const generateTurnoverReport = () => {
    return medications.map(med => {
      const dispensedMovements = stockMovements.filter(m => 
        m.medication_id === med.id && m.movement_type === 'dispensed'
      );
      
      const totalDispensed = dispensedMovements.reduce((sum, m) => sum + m.quantity, 0);
      const avgStock = med.stock_level || 0;
      const consumptionRate = totalDispensed / 30; // per day
      const turnoverRatio = avgStock > 0 ? totalDispensed / avgStock : 0;
      const reorderFreq = turnoverRatio > 0 ? Math.ceil(365 / (turnoverRatio * 30)) : 0;

      return {
        medication_name: med.name,
        avg_stock: avgStock,
        consumption_rate: consumptionRate.toFixed(2),
        turnover_ratio: turnoverRatio.toFixed(2),
        reorder_frequency: `${reorderFreq} times/year`
      };
    });
  };

  const exportToExcel = (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    XLSX.writeFile(workbook, `${fileName}_${timestamp}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory Reports</h2>
          <p className="text-muted-foreground">
            Generate comprehensive inventory analysis reports
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="custom">Custom Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {REPORT_TEMPLATES.map((template) => {
              const IconComponent = template.icon;
              return (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Included Fields:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.fields.slice(0, 3).map((field) => (
                          <Badge key={field} variant="secondary" className="text-xs">
                            {field.replace('_', ' ')}
                          </Badge>
                        ))}
                        {template.fields.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.fields.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => generateReport(template)}
                      disabled={isGenerating}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isGenerating ? 'Generating...' : 'Generate Report'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Report Builder</CardTitle>
              <CardDescription>
                Build custom reports with specific date ranges and filters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium">Date Range</label>
                  <DatePickerWithRange
                    date={dateRange}
                    onDateChange={setDateRange}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Group By</label>
                  <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button className="w-full">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Build Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>
                Automatically generated reports delivered to your email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Scheduled reporting feature coming soon</p>
                <p className="text-sm">Set up automated daily, weekly, or monthly reports</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}