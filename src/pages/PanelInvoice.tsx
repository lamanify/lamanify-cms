import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Download, Printer, FileText, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { useBillingRecords } from '@/hooks/useBillingRecords';
import { usePanels } from '@/hooks/usePanels';
import { useHeaderSettings } from '@/hooks/useHeaderSettings';
import { useToast } from '@/hooks/use-toast';
import { BillingDetailsModal } from '@/components/panel/BillingDetailsModal';

export default function PanelInvoice() {
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedPanelId, setSelectedPanelId] = useState<string>('');
  const [billingDetailsOpen, setBillingDetailsOpen] = useState(false);
  
  const { panels } = usePanels();
  const { headerSettings } = useHeaderSettings();
  const { billingRecords } = useBillingRecords({ 
    payer: 'panel',
    panelId: selectedPanelId || undefined 
  });
  const { toast } = useToast();

  // Filter by date range
  const filteredRecords = billingRecords.filter(record => {
    const recordDate = new Date(record.created_at);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    return recordDate >= startDate && recordDate <= endDate;
  });

  // Group by patient and visit
  const groupedData = filteredRecords.reduce((acc, record) => {
    const key = `${record.patient_id}-${record.visit_id || 'no-visit'}`;
    if (!acc[key]) {
      acc[key] = {
        patient: record.patient,
        visit_id: record.visit_id,
        records: []
      };
    }
    acc[key].records.push(record);
    return acc;
  }, {} as Record<string, any>);

  const totalAmount = filteredRecords.reduce((sum, record) => sum + record.amount, 0);
  const selectedPanel = panels.find(p => p.id === selectedPanelId);

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      const exportData = filteredRecords.map(record => ({
        'Invoice Number': record.invoice_number,
        'Patient Name': record.patient ? `${record.patient.first_name} ${record.patient.last_name}` : '',
        'Visit ID': record.visit_id || '',
        'Description': record.description,
        'Amount': record.amount.toFixed(2),
        'Status': record.status,
        'Date': format(new Date(record.created_at), 'yyyy-MM-dd'),
        'Staff Name': record.staff_name || '',
        'Staff IC': record.staff_ic_passport || '',
        'Relationship': record.relationship_to_patient || ''
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Auto-width columns
      const maxWidths = Object.keys(exportData[0] || {}).map((key, index) => {
        const headerLength = key.length;
        const maxContentLength = Math.max(
          ...exportData.map(row => String(row[key as keyof typeof row] || '').length)
        );
        return Math.max(headerLength, maxContentLength, 10);
      });
      
      worksheet['!cols'] = maxWidths.map(w => ({ width: Math.min(w, 50) }));
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Panel Invoice');
      XLSX.writeFile(workbook, `panel_invoice_${selectedPanel?.panel_name || 'all'}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({
        title: "Export successful",
        description: `${filteredRecords.length} records exported to Excel`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting data.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold">Panel Invoice</h1>
          <p className="text-muted-foreground">Generate and export panel invoices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export XLSX
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="panel-select">Panel</Label>
              <Select value={selectedPanelId} onValueChange={setSelectedPanelId}>
                <SelectTrigger id="panel-select">
                  <SelectValue placeholder="Select panel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Panels</SelectItem>
                  {panels.map(panel => (
                    <SelectItem key={panel.id} value={panel.id}>
                      {panel.panel_name} ({panel.panel_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Preview */}
      <Card className="print:shadow-none print:border-none">
        <CardContent className="p-8 space-y-6">
          {/* Clinic Header */}
          <div className="text-center space-y-2 print:space-y-1">
            <h2 className="text-2xl font-bold print:text-xl">{headerSettings?.clinic_name || 'Clinic Name'}</h2>
            {headerSettings?.address && <p className="text-sm text-muted-foreground">{headerSettings.address}</p>}
            <div className="flex justify-center gap-4 text-sm text-muted-foreground">
              {headerSettings?.phone && <span>Tel: {headerSettings.phone}</span>}
              {headerSettings?.email && <span>Email: {headerSettings.email}</span>}
            </div>
          </div>

          <Separator />

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4 print:gap-2">
            <div>
              <h3 className="font-semibold mb-2">Invoice To:</h3>
              {selectedPanel ? (
                <>
                  <p className="font-medium">{selectedPanel.panel_name}</p>
                  <p className="text-sm text-muted-foreground">Code: {selectedPanel.panel_code}</p>
                  {selectedPanel.person_in_charge_name && (
                    <p className="text-sm">Contact: {selectedPanel.person_in_charge_name}</p>
                  )}
                  {selectedPanel.person_in_charge_phone && (
                    <p className="text-sm">Phone: {selectedPanel.person_in_charge_phone}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Please select a panel</p>
              )}
            </div>

            <div className="text-right">
              <h3 className="font-semibold mb-2">Invoice Details:</h3>
              <p className="text-sm">Period: {format(new Date(dateRange.start), 'dd MMM yyyy')} - {format(new Date(dateRange.end), 'dd MMM yyyy')}</p>
              <p className="text-sm">Date: {format(new Date(), 'dd MMM yyyy')}</p>
              <p className="text-sm">Total Records: {filteredRecords.length}</p>
            </div>
          </div>

          <div className="print:hidden">
            <Button variant="outline" size="sm" onClick={() => setBillingDetailsOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Change Billing Details
            </Button>
          </div>

          <Separator />

          {/* Grouped Invoice Items */}
          <div className="space-y-6">
            <h3 className="font-semibold">Invoice Items</h3>
            
            {Object.entries(groupedData).map(([key, group]: [string, any]) => (
              <div key={key} className="space-y-2 border-b pb-4 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {group.patient ? `${group.patient.first_name} ${group.patient.last_name}` : 'Unknown Patient'}
                    </p>
                    <p className="text-sm text-muted-foreground">Visit ID: {group.visit_id || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      RM {group.records.reduce((sum: number, r: any) => sum + r.amount, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="pl-4 space-y-1">
                  {group.records.map((record: any) => (
                    <div key={record.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{record.description}</span>
                      <span>RM {record.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Amount:</span>
              <span>RM {totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Signature Section */}
          <div className="mt-12 pt-6 border-t print:mt-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-medium mb-4">Prepared By:</p>
                <div className="border-t pt-2 mt-12">
                  <p className="text-sm">Name: _____________________</p>
                  <p className="text-sm mt-2">Date: _____________________</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-4">Authorized Signature:</p>
                <div className="border-t pt-2 mt-12">
                  <p className="text-sm">Name: _____________________</p>
                  <p className="text-sm mt-2">Date: _____________________</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Details Modal */}
      <BillingDetailsModal 
        open={billingDetailsOpen}
        onOpenChange={setBillingDetailsOpen}
        billingRecords={filteredRecords}
      />
    </div>
  );
}
