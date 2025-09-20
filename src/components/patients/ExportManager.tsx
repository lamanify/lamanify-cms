import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  sortable: boolean;
}
import { Download, FileText, Table, Users, Calendar, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ExportManagerProps {
  patients: any[];
  selectedPatients: string[];
  columns: ColumnConfig[];
}

export function ExportManager({ patients, selectedPatients, columns }: ExportManagerProps) {
  const [open, setOpen] = useState(false);
  const [exportType, setExportType] = useState<'csv' | 'excel'>('csv');
  const [exportScope, setExportScope] = useState<'all' | 'filtered' | 'selected'>('filtered');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns.filter(col => col.visible).map(col => col.key)
  );
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getExportData = () => {
    let dataToExport = patients;
    
    if (exportScope === 'selected') {
      dataToExport = patients.filter(p => selectedPatients.includes(p.id));
    }
    
    return dataToExport.map(patient => {
      const row: any = {};
      
      selectedColumns.forEach(columnKey => {
        switch (columnKey) {
          case 'name':
            row['Patient Name'] = `${patient.first_name} ${patient.last_name}`;
            break;
          case 'patient_id':
            row['Patient ID'] = patient.patient_id || '';
            break;
          case 'age':
            row['Age'] = calculateAge(patient.date_of_birth);
            break;
          case 'phone':
            row['Phone'] = patient.phone || '';
            break;
          case 'last_visit_date':
            row['Last Visit'] = patient.last_visit_date ? 
              format(new Date(patient.last_visit_date), 'yyyy-MM-dd') : '';
            break;
          case 'last_diagnosis':
            row['Last Diagnosis'] = patient.last_diagnosis || '';
            break;
          case 'total_visits':
            row['Total Visits'] = patient.total_visits || 0;
            break;
          case 'amount_spent':
            row['Amount Spent'] = (patient.amount_spent || 0).toFixed(2);
            break;
          case 'tier':
            row['Tier'] = patient.price_tiers?.tier_name || '';
            break;
          case 'created_at':
            row['Registration Date'] = format(new Date(patient.created_at), 'yyyy-MM-dd');
            break;
          default:
            const column = columns.find(col => col.key === columnKey);
            if (column) {
              row[column.label] = patient[columnKey] || '';
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
          // Escape commas and quotes
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

  const handleExport = async () => {
    setLoading(true);
    
    try {
      const exportData = getExportData();
      
      if (exportData.length === 0) {
        toast({
          title: "No data to export",
          description: "Please select patients or adjust your filters.",
          variant: "destructive",
        });
        return;
      }
      
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      const scopeLabel = exportScope === 'selected' ? 'selected' : 'filtered';
      const filename = `patients_${scopeLabel}_${timestamp}.${exportType}`;
      
      if (exportType === 'csv') {
        downloadCSV(exportData, filename);
      } else {
        // For Excel export, we'll use CSV for now but could integrate a library like xlsx
        downloadCSV(exportData, filename.replace('.excel', '.csv'));
      }
      
      toast({
        title: "Export successful",
        description: `${exportData.length} patients exported to ${filename}`,
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
    setSelectedColumns(columns.map(col => col.key));
  };

  const deselectAllColumns = () => {
    setSelectedColumns([]);
  };

  const getRecordCount = () => {
    switch (exportScope) {
      case 'all':
        return patients.length;
      case 'selected':
        return selectedPatients.length;
      case 'filtered':
      default:
        return patients.length;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Patient Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Settings */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Export Format
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={exportType} onValueChange={(value: 'csv' | 'excel') => setExportType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV Format</SelectItem>
                    <SelectItem value="excel">Excel Format</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Export Scope
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={exportScope} onValueChange={(value: 'all' | 'filtered' | 'selected') => setExportScope(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="filtered">Filtered Results ({patients.length})</SelectItem>
                    <SelectItem value="selected" disabled={selectedPatients.length === 0}>
                      Selected Only ({selectedPatients.length})
                    </SelectItem>
                    <SelectItem value="all">All Patients</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Export Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  Export Preview
                </span>
                <Badge variant="secondary">
                  {getRecordCount()} records
                </Badge>
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
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Select Columns to Export</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={selectAllColumns}>
                        Select All
                      </Button>
                      <Button variant="ghost" size="sm" onClick={deselectAllColumns}>
                        Clear All
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {columns.map((column) => (
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
              </div>
            </CardContent>
          </Card>

          {/* Export Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Ready to export {getRecordCount()} patients with {selectedColumns.length} columns
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleExport} 
                disabled={loading || selectedColumns.length === 0}
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