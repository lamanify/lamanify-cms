import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Clock, User, FileText, Filter, Download } from 'lucide-react';
import { toast } from 'sonner';

interface AuditRecord {
  id: string;
  purchase_order_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by: string | null;
  changed_at: string;
  change_reason: string | null;
  metadata: any;
  po_number?: string;
  user_name?: string;
}

export function PurchaseOrderAuditTrail() {
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    fetchAuditRecords();
  }, []);

  const fetchAuditRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_order_audit')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch related data separately since direct joins may not work
      const formattedRecords = await Promise.all(
        (data || []).map(async (record) => {
          // Get PO number
          let poNumber = 'N/A';
          if (record.purchase_order_id) {
            const { data: poData } = await supabase
              .from('purchase_orders')
              .select('po_number')
              .eq('id', record.purchase_order_id)
              .single();
            poNumber = poData?.po_number || 'N/A';
          }

          // Get user name
          let userName = 'System';
          if (record.changed_by) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', record.changed_by)
              .single();
            if (profileData) {
              userName = `${profileData.first_name} ${profileData.last_name}`;
            }
          }

          return {
            ...record,
            po_number: poNumber,
            user_name: userName
          };
        })
      );

      setAuditRecords(formattedRecords);
    } catch (error) {
      console.error('Error fetching audit records:', error);
      toast.error('Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  // Filter audit records
  const filteredRecords = auditRecords.filter(record => {
    const matchesSearch = !searchTerm || 
      record.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.new_status === statusFilter;
    const matchesDateRange = (!dateRange.from || record.changed_at >= dateRange.from) &&
                            (!dateRange.to || record.changed_at <= dateRange.to);
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      ordered: 'bg-purple-100 text-purple-800',
      partially_received: 'bg-orange-100 text-orange-800',
      received: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const exportAuditTrail = () => {
    const csvContent = [
      ['PO Number', 'Previous Status', 'New Status', 'Changed By', 'Changed At', 'Reason'].join(','),
      ...filteredRecords.map(record => [
        record.po_number || '',
        record.previous_status || '',
        record.new_status,
        record.user_name || '',
        format(new Date(record.changed_at), 'yyyy-MM-dd HH:mm:ss'),
        record.change_reason || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `po_audit_trail_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-6">Loading audit trail...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Purchase Order Audit Trail</h2>
          <p className="text-muted-foreground">
            Complete history of all purchase order changes and status updates
          </p>
        </div>
        <Button variant="outline" onClick={exportAuditTrail}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Search PO number or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status Changes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status Changes</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="ordered">Ordered</SelectItem>
                <SelectItem value="partially_received">Partially Received</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="From Date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            />
            <Input
              type="date"
              placeholder="To Date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Audit Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Records ({filteredRecords.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Previous Status</TableHead>
                <TableHead>New Status</TableHead>
                <TableHead>Changed By</TableHead>
                <TableHead>Changed At</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Operation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record.po_number || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {record.previous_status ? getStatusBadge(record.previous_status) : '-'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(record.new_status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {record.user_name || 'System'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div>{format(new Date(record.changed_at), 'MMM dd, yyyy')}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(record.changed_at), 'HH:mm:ss')}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {record.change_reason || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {record.metadata?.operation || 'UPDATE'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredRecords.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No audit records found matching the current filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}