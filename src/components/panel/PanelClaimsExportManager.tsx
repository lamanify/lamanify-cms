import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileText, Table, Calendar, Settings, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { PanelClaim } from '@/hooks/usePanelClaims';
import * as XLSX from 'xlsx';

interface ExportColumn {
  key: string;
  label: string;
  visible: boolean;
}

interface PanelClaimsExportManagerProps {
  claims: PanelClaim[];
  filteredClaims: PanelClaim[];
  selectedClaims: string[];
}

const defaultColumns: ExportColumn[] = [
  { key: 'claim_number', label: 'Claim Number', visible: true },
  { key: 'panel_name', label: 'Panel Name', visible: true },
  { key: 'panel_code', label: 'Panel Code', visible: true },
  { key: 'billing_period_start', label: 'Period Start', visible: true },
  { key: 'billing_period_end', label: 'Period End', visible: true },
  { key: 'total_items', label: 'Total Items', visible: true },
  { key: 'total_amount', label: 'Total Amount', visible: true },
  { key: 'status', label: 'Status', visible: true },
  { key: 'created_at', label: 'Created Date', visible: true },
  { key: 'submitted_at', label: 'Submitted Date', visible: false },
  { key: 'approved_at', label: 'Approved Date', visible: false },
  { key: 'paid_at', label: 'Paid Date', visible: false },
  { key: 'paid_amount', label: 'Paid Amount', visible: false },
  { key: 'panel_reference_number', label: 'Panel Reference', visible: false },
  { key: 'notes', label: 'Notes', visible: false },
];

export function PanelClaimsExportManager({ claims, filteredClaims, selectedClaims }: PanelClaimsExportManagerProps) {
  const [open, setOpen] = useState(false);
  const [exportType, setExportType] = useState<'csv' | 'excel' | 'pdf'>('excel');
  const [exportScope, setExportScope] = useState<'all' | 'filtered' | 'selected'>('filtered');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    defaultColumns.filter(col => col.visible).map(col => col.key)
  );
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [includeItemDetails, setIncludeItemDetails] = useState(false);
  
  const { toast } = useToast();

  const getExportData = () => {
    let dataToExport = claims;
    
    if (exportScope === 'selected') {
      dataToExport = claims.filter(c => selectedClaims.includes(c.id));
    } else if (exportScope === 'filtered') {
      dataToExport = filteredClaims;
    }
    
    // Apply date range filter
    dataToExport = dataToExport.filter(claim => {
      const claimDate = new Date(claim.created_at);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      return claimDate >= startDate && claimDate <= endDate;
    });
    
    return dataToExport.map(claim => {
      const row: any = {};
      
      selectedColumns.forEach(columnKey => {
        switch (columnKey) {
          case 'claim_number':
            row['Claim Number'] = claim.claim_number;
            break;
          case 'panel_name':
            row['Panel Name'] = claim.panel?.panel_name || '';
            break;
          case 'panel_code':
            row['Panel Code'] = claim.panel?.panel_code || '';
            break;
          case 'billing_period_start':
            row['Period Start'] = format(new Date(claim.billing_period_start), 'yyyy-MM-dd');
            break;
          case 'billing_period_end':
            row['Period End'] = format(new Date(claim.billing_period_end), 'yyyy-MM-dd');
            break;
          case 'total_items':
            row['Total Items'] = claim.total_items;
            break;
          case 'total_amount':
            row['Total Amount'] = claim.total_amount.toFixed(2);
            break;
          case 'status':
            row['Status'] = claim.status.charAt(0).toUpperCase() + claim.status.slice(1);
            break;
          case 'created_at':
            row['Created Date'] = format(new Date(claim.created_at), 'yyyy-MM-dd HH:mm');
            break;
          case 'submitted_at':
            row['Submitted Date'] = claim.submitted_at ? format(new Date(claim.submitted_at), 'yyyy-MM-dd HH:mm') : '';
            break;
          case 'approved_at':
            row['Approved Date'] = claim.approved_at ? format(new Date(claim.approved_at), 'yyyy-MM-dd HH:mm') : '';
            break;
          case 'paid_at':
            row['Paid Date'] = claim.paid_at ? format(new Date(claim.paid_at), 'yyyy-MM-dd HH:mm') : '';
            break;
          case 'paid_amount':
            row['Paid Amount'] = claim.paid_amount ? claim.paid_amount.toFixed(2) : '';
            break;
          case 'panel_reference_number':
            row['Panel Reference'] = claim.panel_reference_number || '';
            break;
          case 'notes':
            row['Notes'] = claim.notes || '';
            break;
          default:
            const column = defaultColumns.find(col => col.key === columnKey);
            if (column) {
              row[column.label] = (claim as any)[columnKey] || '';
            }
        }
      });
      
      return row;
    });
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      includeHeaders ? headers.join(',') : '',
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].filter(row => row).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadExcel = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Auto-width columns
    const maxWidths: number[] = [];
    const headers = Object.keys(data[0]);
    
    headers.forEach((header, index) => {
      const headerLength = header.length;
      const maxContentLength = Math.max(
        ...data.map(row => String(row[header] || '').length)
      );
      maxWidths[index] = Math.max(headerLength, maxContentLength, 10);
    });
    
    worksheet['!cols'] = maxWidths.map(w => ({ width: Math.min(w, 50) }));
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Panel Claims');
    XLSX.writeFile(workbook, filename);
  };

  const generatePDF = async (data: any[], filename: string) => {
    // For PDF generation, we'll use HTML and print functionality
    // This is a simple implementation - can be enhanced with a PDF library
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const headers = Object.keys(data[0]);
    const htmlContent = `
      <html>
        <head>
          <title>Panel Claims Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            h1 { color: #333; margin-bottom: 20px; }
            .export-info { margin-bottom: 20px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Panel Claims Export</h1>
          <div class="export-info">
            <p>Export generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</p>
            <p>Total records: ${data.length}</p>
            <p>Date range: ${dateRange.start} to ${dateRange.end}</p>
          </div>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${data.map(row => 
                `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`
              ).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExport = async () => {
    setLoading(true);
    
    try {
      const exportData = getExportData();
      
      if (exportData.length === 0) {
        toast({
          title: "No data to export",
          description: "Please adjust your filters or date range.",
          variant: "destructive",
        });
        return;
      }
      
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      const scopeLabel = exportScope === 'selected' ? 'selected' : exportScope;
      const filename = `panel_claims_${scopeLabel}_${timestamp}.${exportType}`;
      
      switch (exportType) {
        case 'csv':
          downloadCSV(exportData, filename);
          break;
        case 'excel':
          downloadExcel(exportData, filename);
          break;
        case 'pdf':
          await generatePDF(exportData, filename);
          break;
      }
      
      toast({
        title: "Export successful",
        description: `${exportData.length} claims exported to ${filename}`,
      });
      
      setOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleColumn = (columnKey: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const selectAllColumns = () => {
    setSelectedColumns(defaultColumns.map(col => col.key));
  };

  const deselectAllColumns = () => {
    setSelectedColumns([]);
  };

  const getRecordCount = () => {
    let count = 0;
    switch (exportScope) {
      case 'all':
        count = claims.length;
        break;
      case 'selected':
        count = selectedClaims.length;
        break;
      case 'filtered':
      default:
        count = filteredClaims.length;
        break;
    }
    
    // Apply date range filter to get accurate count
    const dataToCount = exportScope === 'selected' 
      ? claims.filter(c => selectedClaims.includes(c.id))
      : exportScope === 'filtered' 
        ? filteredClaims 
        : claims;
        
    return dataToCount.filter(claim => {
      const claimDate = new Date(claim.created_at);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      return claimDate >= startDate && claimDate <= endDate;
    }).length;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Claims
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Panel Claims
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Export Format
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={exportType} onValueChange={(value: 'csv' | 'excel' | 'pdf') => setExportType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (XLSX)</SelectItem>
                    <SelectItem value="csv">CSV Format</SelectItem>
                    <SelectItem value="pdf">PDF Report</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  Export Scope
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={exportScope} onValueChange={(value: 'all' | 'filtered' | 'selected') => setExportScope(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="filtered">Filtered Results ({filteredClaims.length})</SelectItem>
                    <SelectItem value="selected" disabled={selectedClaims.length === 0}>
                      Selected Only ({selectedClaims.length})
                    </SelectItem>
                    <SelectItem value="all">All Claims ({claims.length})</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Range
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <Label htmlFor="start-date" className="text-xs">From</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="text-xs">To</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Export Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={includeHeaders}
                    onCheckedChange={(checked) => setIncludeHeaders(!!checked)}
                  />
                  <label className="text-sm">Include column headers</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={includeItemDetails}
                    onCheckedChange={(checked) => setIncludeItemDetails(!!checked)}
                  />
                  <label className="text-sm">Include claim item details (separate sheet)</label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Column Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  Select Columns
                </span>
                <Badge variant="secondary">
                  {getRecordCount()} records
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Choose columns to export</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={selectAllColumns}>
                      Select All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={deselectAllColumns}>
                      Clear All
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {defaultColumns.map((column) => (
                    <div key={column.key} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedColumns.includes(column.key)}
                        onCheckedChange={() => toggleColumn(column.key)}
                      />
                      <label className="text-xs">
                        {column.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Ready to export {getRecordCount()} claims with {selectedColumns.length} columns
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleExport} 
                disabled={loading || selectedColumns.length === 0 || getRecordCount() === 0}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export {exportType.toUpperCase()}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}