import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, Send, Eye, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { QuotationRequestModal } from './QuotationRequestModal';
import { QuotationComparisonModal } from './QuotationComparisonModal';
import { format } from 'date-fns';

interface QuotationRequest {
  id: string;
  request_number: string;
  title: string;
  description?: string;
  supplier_id?: string;
  requested_by: string;
  request_date: string;
  required_by_date?: string;
  status: 'pending' | 'sent' | 'received' | 'expired' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
        supplier: {
          id: string;
          supplier_name: string;
        };
  quotation_request_items: Array<{
    id: string;
    item_description: string;
    requested_quantity: number;
    unit_of_measure: string;
    specifications?: string;
  }>;
}

interface Quotation {
  id: string;
  quotation_number: string;
  quotation_request_id: string;
  supplier_id: string;
  quotation_date: string;
  valid_until?: string;
  status: 'received' | 'under_review' | 'accepted' | 'rejected' | 'expired';
  total_amount: number;
  currency: string;
  payment_terms?: string;
  delivery_terms?: string;
  supplier_reference?: string;
      supplier: {
        id: string;
        supplier_name: string;
      };
  quotation_items: Array<{
    id: string;
    item_description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export const QuotationManager: React.FC = () => {
  const [quotationRequests, setQuotationRequests] = useState<QuotationRequest[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('requests');

  useEffect(() => {
    fetchQuotationData();
  }, []);

  const fetchQuotationData = async () => {
    try {
      setLoading(true);
      
          // Fetch quotation requests
          const { data: requestsData, error: requestsError } = await supabase
            .from('quotation_requests')
            .select(`
              *,
              supplier:suppliers(id, supplier_name),
              quotation_request_items(*)
            `)
            .order('created_at', { ascending: false });

          if (requestsError) throw requestsError;

          // Fetch quotations
          const { data: quotationsData, error: quotationsError } = await supabase
            .from('quotations')
            .select(`
              *,
              supplier:suppliers(id, supplier_name),
              quotation_items(*)
            `)
            .order('created_at', { ascending: false });

          if (quotationsError) throw quotationsError;

          setQuotationRequests((requestsData || []).map(req => ({
            ...req,
            status: req.status as QuotationRequest['status'],
            priority: req.priority as QuotationRequest['priority']
          })));
          setQuotations((quotationsData || []).map(q => ({
            ...q,
            status: q.status as Quotation['status']
          })));
    } catch (error) {
      console.error('Error fetching quotation data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch quotation data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToPoAO = async (quotationId: string) => {
    try {
      const { data, error } = await supabase.rpc('convert_quotation_to_po', {
        p_quotation_id: quotationId
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quotation converted to Purchase Order successfully.",
      });
      
      fetchQuotationData(); // Refresh data
    } catch (error) {
      console.error('Error converting quotation to PO:', error);
      toast({
        title: "Error", 
        description: "Failed to convert quotation to Purchase Order.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'sent': return 'default';
      case 'received': return 'default';
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      case 'expired': return 'secondary';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'normal': return 'secondary';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return <div>Loading quotation data...</div>;
  }

  const pendingRequests = quotationRequests.filter(req => req.status === 'pending').length;
  const receivedQuotations = quotations.filter(q => q.status === 'received').length;
  const pendingReview = quotations.filter(q => q.status === 'under_review').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Quotation Management</h2>
          <p className="text-muted-foreground">
            Manage quotation requests and supplier quotes
          </p>
        </div>
        <Button 
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Quotation Request
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received Quotations</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receivedQuotations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReview}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="requests">Quotation Requests</TabsTrigger>
          <TabsTrigger value="quotations">Received Quotations</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Quotation Requests</CardTitle>
              <CardDescription>
                Track and manage your quotation requests to suppliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request Number</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotationRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono">
                        {request.request_number}
                      </TableCell>
                      <TableCell>{request.title}</TableCell>
                      <TableCell>
                        {request.supplier?.supplier_name || 'Any Supplier'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(request.priority)}>
                          {request.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.request_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedRequestId(request.id);
                            setShowComparisonModal(true);
                          }}
                        >
                          View Quotes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotations">
          <Card>
            <CardHeader>
              <CardTitle>Received Quotations</CardTitle>
              <CardDescription>
                Review and compare quotations from suppliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Quote Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell className="font-mono">
                        {quotation.quotation_number}
                      </TableCell>
                      <TableCell>{quotation.supplier.supplier_name}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(quotation.status)}>
                          {quotation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {quotation.currency} {quotation.total_amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {quotation.valid_until 
                          ? format(new Date(quotation.valid_until), 'MMM dd, yyyy')
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(quotation.quotation_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {quotation.status === 'accepted' ? (
                          <Button 
                            size="sm"
                            onClick={() => handleConvertToPoAO(quotation.id)}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Convert to PO
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm">
                            Review
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <QuotationRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={fetchQuotationData}
      />

      <QuotationComparisonModal
        isOpen={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        quotationRequestId={selectedRequestId}
      />
    </div>
  );
};