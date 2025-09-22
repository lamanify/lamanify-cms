import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Separator } from '@/components/ui/separator';
import { useProcurementAnalytics } from '@/hooks/useProcurementAnalytics';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  Settings,
  Mail,
  Printer,
  Share
} from 'lucide-react';
import { format } from 'date-fns';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'financial' | 'operational' | 'supplier' | 'inventory';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  sections: string[];
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'monthly-spend',
    name: 'Monthly Spend Report',
    description: 'Comprehensive monthly procurement spending analysis',
    type: 'financial',
    frequency: 'monthly',
    sections: ['spend-summary', 'category-breakdown', 'supplier-performance', 'trends']
  },
  {
    id: 'supplier-performance',
    name: 'Supplier Performance Report',
    description: 'Detailed supplier performance metrics and ratings',
    type: 'supplier',
    frequency: 'quarterly',
    sections: ['supplier-scorecard', 'delivery-metrics', 'quality-scores', 'cost-analysis']
  },
  {
    id: 'procurement-dashboard',
    name: 'Executive Dashboard',
    description: 'High-level procurement KPIs for executive review',
    type: 'operational',
    frequency: 'weekly',
    sections: ['kpi-summary', 'cost-savings', 'risk-indicators', 'recommendations']
  },
  {
    id: 'inventory-analysis',
    name: 'Inventory Analysis Report',
    description: 'Stock levels, turnover, and procurement needs analysis',
    type: 'inventory',
    frequency: 'weekly',
    sections: ['stock-levels', 'turnover-analysis', 'reorder-recommendations', 'cost-trends']
  }
];

export function ProcurementReports() {
  const { analyticsData, loading, fetchAnalyticsData, exportAnalyticsReport } = useProcurementAnalytics();
  const { suppliers, purchaseOrders } = usePurchaseOrders();
  const { toast } = useToast();

  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [reportConfig, setReportConfig] = useState({
    dateRange: { from: '', to: '' },
    suppliers: [] as string[],
    categories: [] as string[],
    statuses: [] as string[],
    format: 'pdf' as 'pdf' | 'csv' | 'excel',
    includeCharts: true,
    includeDetailedData: false,
    emailTo: '',
    scheduleFrequency: 'none' as 'none' | 'daily' | 'weekly' | 'monthly'
  });

  const [customReport, setCustomReport] = useState({
    title: '',
    sections: [] as string[],
    filters: {
      dateRange: true,
      suppliers: true,
      categories: true,
      statuses: true
    }
  });

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setReportConfig(prev => ({
      ...prev,
      format: template.type === 'financial' ? 'excel' : 'pdf'
    }));
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate) {
      toast({
        title: 'Error',
        description: 'Please select a report template',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Generate report based on template and configuration
      const reportData = await generateReportData(selectedTemplate, reportConfig);
      
      // Export the report
      await exportReport(reportData, reportConfig.format);
      
      toast({
        title: 'Success',
        description: `${selectedTemplate.name} generated successfully`,
      });
    } catch (error) {
      console.error('Report generation failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive'
      });
    }
  };

  const generateReportData = async (template: ReportTemplate, config: any) => {
    // Fetch analytics data if not already loaded
    if (!analyticsData) {
      await fetchAnalyticsData(config.dateRange);
    }

    // Build report data based on template sections
    const reportData = {
      metadata: {
        title: template.name,
        generatedAt: new Date().toISOString(),
        dateRange: config.dateRange,
        filters: config
      },
      sections: {}
    };

    template.sections.forEach(section => {
      switch (section) {
        case 'spend-summary':
          reportData.sections[section] = {
            totalSpend: analyticsData?.totalSpend || 0,
            totalOrders: analyticsData?.totalOrders || 0,
            averageOrderValue: analyticsData?.averageOrderValue || 0
          };
          break;
        case 'supplier-performance':
          reportData.sections[section] = {
            topSuppliers: analyticsData?.topSuppliers || []
          };
          break;
        case 'category-breakdown':
          reportData.sections[section] = {
            spendByCategory: analyticsData?.spendByCategory || []
          };
          break;
        case 'trends':
          reportData.sections[section] = {
            monthlyTrends: analyticsData?.monthlyTrends || []
          };
          break;
        default:
          reportData.sections[section] = {};
      }
    });

    return reportData;
  };

  const exportReport = async (data: any, format: string) => {
    // This would integrate with your preferred reporting library
    // For now, we'll use the existing export functionality
    if (format === 'csv') {
      await exportAnalyticsReport('csv');
    } else {
      // PDF/Excel export would be implemented here
      toast({
        title: 'Info',
        description: `${format.toUpperCase()} export feature will be implemented with a proper reporting library`,
      });
    }
  };

  const handleScheduleReport = () => {
    if (reportConfig.scheduleFrequency === 'none') {
      toast({
        title: 'Error',
        description: 'Please select a schedule frequency',
        variant: 'destructive'
      });
      return;
    }

    // This would integrate with a job scheduler
    toast({
      title: 'Success',
      description: `Report scheduled to run ${reportConfig.scheduleFrequency}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Procurement Reports</h2>
          <p className="text-muted-foreground">Generate comprehensive procurement reports and analytics</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="custom">Custom Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>

        {/* Report Templates */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template Selection */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold">Select Report Template</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTemplates.map((template) => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <Badge variant="secondary">{template.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {template.frequency}
                        <Separator orientation="vertical" className="h-3" />
                        <BarChart3 className="h-3 w-3" />
                        {template.sections.length} sections
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Report Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Report Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTemplate && (
                  <>
                    <div>
                      <Label className="text-sm font-medium">Selected Template</Label>
                      <div className="mt-1 p-2 bg-muted rounded text-sm">
                        {selectedTemplate.name}
                      </div>
                    </div>

                    <div>
                      <Label>Date Range</Label>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          placeholder="Start date"
                          value={reportConfig.dateRange.from}
                          onChange={(e) => setReportConfig(prev => ({ 
                            ...prev, 
                            dateRange: { ...prev.dateRange, from: e.target.value }
                          }))}
                        />
                        <Input
                          type="date"
                          placeholder="End date"
                          value={reportConfig.dateRange.to}
                          onChange={(e) => setReportConfig(prev => ({ 
                            ...prev, 
                            dateRange: { ...prev.dateRange, to: e.target.value }
                          }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="format">Export Format</Label>
                      <Select
                        value={reportConfig.format}
                        onValueChange={(value: any) => setReportConfig(prev => ({ ...prev, format: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeCharts"
                          checked={reportConfig.includeCharts}
                          onCheckedChange={(checked) => setReportConfig(prev => ({ ...prev, includeCharts: !!checked }))}
                        />
                        <Label htmlFor="includeCharts" className="text-sm">Include Charts</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeDetailedData"
                          checked={reportConfig.includeDetailedData}
                          onCheckedChange={(checked) => setReportConfig(prev => ({ ...prev, includeDetailedData: !!checked }))}
                        />
                        <Label htmlFor="includeDetailedData" className="text-sm">Include Detailed Data</Label>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="emailTo">Email To (Optional)</Label>
                      <Input
                        id="emailTo"
                        type="email"
                        placeholder="email@example.com"
                        value={reportConfig.emailTo}
                        onChange={(e) => setReportConfig(prev => ({ ...prev, emailTo: e.target.value }))}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="schedule">Schedule (Optional)</Label>
                      <Select
                        value={reportConfig.scheduleFrequency}
                        onValueChange={(value: any) => setReportConfig(prev => ({ ...prev, scheduleFrequency: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Schedule</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4 space-y-2">
                      <Button onClick={handleGenerateReport} className="w-full" disabled={loading}>
                        <Download className="h-4 w-4 mr-2" />
                        {loading ? 'Generating...' : 'Generate Report'}
                      </Button>
                      {reportConfig.scheduleFrequency !== 'none' && (
                        <Button onClick={handleScheduleReport} variant="outline" className="w-full">
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Report
                        </Button>
                      )}
                      {reportConfig.emailTo && (
                        <Button variant="outline" className="w-full">
                          <Mail className="h-4 w-4 mr-2" />
                          Email Report
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Custom Reports */}
        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Custom Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customTitle">Report Title</Label>
                <Input
                  id="customTitle"
                  placeholder="Enter report title"
                  value={customReport.title}
                  onChange={(e) => setCustomReport(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Include Sections</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    'spend-summary',
                    'supplier-performance',
                    'category-breakdown',
                    'trends',
                    'delivery-metrics',
                    'cost-savings',
                    'risk-indicators'
                  ].map((section) => (
                    <div key={section} className="flex items-center space-x-2">
                      <Checkbox
                        id={section}
                        checked={customReport.sections.includes(section)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCustomReport(prev => ({
                              ...prev,
                              sections: [...prev.sections, section]
                            }));
                          } else {
                            setCustomReport(prev => ({
                              ...prev,
                              sections: prev.sections.filter(s => s !== section)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={section} className="text-sm capitalize">
                        {section.replace('-', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Available Filters</Label>
                <div className="mt-2 space-y-2">
                  {Object.entries(customReport.filters).map(([filter, enabled]) => (
                    <div key={filter} className="flex items-center space-x-2">
                      <Checkbox
                        id={filter}
                        checked={enabled}
                        onCheckedChange={(checked) => setCustomReport(prev => ({
                          ...prev,
                          filters: { ...prev.filters, [filter]: !!checked }
                        }))}
                      />
                      <Label htmlFor={filter} className="text-sm capitalize">
                        {filter.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Create Custom Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Reports */}
        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scheduled reports configured</p>
                <p className="text-sm">Create a scheduled report from the templates tab</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report History */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No reports generated yet</p>
                <p className="text-sm">Generated reports will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}