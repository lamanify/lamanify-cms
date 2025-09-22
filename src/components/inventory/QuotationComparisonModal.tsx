import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, X, Eye, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Quotation {
  id: string;
  quotation_number: string;
  supplier_id: string;
  quotation_date: string;
  valid_until?: string;
  status: 'received' | 'under_review' | 'accepted' | 'rejected' | 'expired';
  total_amount: number;
  currency: string;
  payment_terms?: string;
  delivery_terms?: string;
  supplier_reference?: string;
  comparison_notes?: string;
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
    unit_of_measure: string;
    brand?: string;
    specifications?: string;
    delivery_time_days?: number;
    minimum_order_quantity?: number;
  }>;
}

interface QuotationRequest {
  id: string;
  request_number: string;
  title: string;
  description?: string;
  status: string;
  quotation_request_items: Array<{
    id: string;
    item_description: string;
    requested_quantity: number;
    unit_of_measure: string;
    specifications?: string;
  }>;
}

interface QuotationComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationRequestId: string | null;
}

export const QuotationComparisonModal: React.FC<QuotationComparisonModalProps> = ({
  isOpen,
  onClose,
  quotationRequestId
}) => {
  const [quotationRequest, setQuotationRequest] = useState<QuotationRequest | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && quotationRequestId) {
      fetchQuotationData();
    }
  }, [isOpen, quotationRequestId]);

  const fetchQuotationData = async () => {
    if (!quotationRequestId) return;

    try {
      setLoading(true);

      // Fetch quotation request details
      const { data: requestData, error: requestError } = await supabase
        .from('quotation_requests')
        .select(`
          *,
          quotation_request_items(*)
        `)
        .eq('id', quotationRequestId)
        .single();

      if (requestError) throw requestError;

        // Fetch related quotations
        const { data: quotationsData, error: quotationsError } = await supabase
          .from('quotations')
          .select(`
            *,
            supplier:suppliers(id, supplier_name),
            quotation_items(*)
          `)
          .eq('quotation_request_id', quotationRequestId)
          .order('created_at', { ascending: false });

        if (quotationsError) throw quotationsError;

        setQuotationRequest(requestData);
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

  const handleQuotationStatusUpdate = async (quotationId: string, newStatus: string, rejectionReason?: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'accepted') {
        updateData.accepted_at = new Date().toISOString();
        updateData.accepted_by = (await supabase.auth.getUser()).data.user?.id;
      } else if (newStatus === 'rejected' && rejectionReason) {
        updateData.rejected_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('quotations')
        .update(updateData)
        .eq('id', quotationId);

      if (error) throw error;

      // If accepted, mark all other quotations as rejected
      if (newStatus === 'accepted') {
        const { error: rejectError } = await supabase
          .from('quotations')
          .update({ 
            status: 'rejected', 
            rejected_reason: 'Another quotation was selected' 
          })
          .eq('quotation_request_id', quotationRequestId)
          .neq('id', quotationId);

        if (rejectError) throw rejectError;
      }

      toast({
        title: "Success",
        description: `Quotation ${newStatus} successfully.`,
      });

      fetchQuotationData();
    } catch (error) {
      console.error('Error updating quotation status:', error);
      toast({
        title: "Error",
        description: "Failed to update quotation status.",
        variant: "destructive",
      });
    }
  };

  const handleConvertToPO = async (quotationId: string) => {
    try {
      const { data, error } = await supabase.rpc('convert_quotation_to_po', {
        p_quotation_id: quotationId
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quotation converted to Purchase Order successfully.",
      });
      
      onClose();
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
      case 'received': return 'default';
      case 'under_review': return 'secondary';
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      case 'expired': return 'secondary';
      default: return 'secondary';
    }
  };

  const getBestPrice = (itemDescription: string) => {
    const prices = quotations
      .filter(q => q.status !== 'rejected')
      .map(q => q.quotation_items.find(item => item.item_description === itemDescription))
      .filter(Boolean)
      .map(item => item!.unit_price);
    
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div>Loading quotation comparison...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!quotationRequest) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quotation Comparison - {quotationRequest.request_number}</DialogTitle>
          <DialogDescription>
            Compare quotations for: {quotationRequest.title}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="comparison" className="w-full">
          <TabsList>
            <TabsTrigger value="comparison">Comparison View</TabsTrigger>
            <TabsTrigger value="details">Detailed View</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{quotations.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Lowest Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {quotations.length > 0 
                      ? `MYR ${Math.min(...quotations.map(q => q.total_amount)).toFixed(2)}`
                      : 'N/A'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Accepted Quotation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {quotations.find(q => q.status === 'accepted') ? 'Yes' : 'None'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle>Price Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        {quotations.map((quotation) => (
                          <TableHead key={quotation.id} className="text-center">
                            <div className="space-y-1">
                              <div className="font-medium">{quotation.supplier.supplier_name}</div>
                              <Badge variant={getStatusBadgeVariant(quotation.status)} className="text-xs">
                                {quotation.status}
                              </Badge>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotationRequest.quotation_request_items.map((requestItem) => {
                        const bestPrice = getBestPrice(requestItem.item_description);
                        
                        return (
                          <TableRow key={requestItem.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{requestItem.item_description}</div>
                                <div className="text-sm text-muted-foreground">
                                  Qty: {requestItem.requested_quantity} {requestItem.unit_of_measure}
                                </div>
                              </div>
                            </TableCell>
                            {quotations.map((quotation) => {
                              const quotationItem = quotation.quotation_items.find(
                                item => item.item_description === requestItem.item_description
                              );
                              
                              return (
                                <TableCell key={quotation.id} className="text-center">
                                  {quotationItem ? (
                                    <div className="space-y-1">
                                      <div className={`font-medium ${
                                        quotationItem.unit_price === bestPrice && quotations.filter(q => q.status !== 'rejected').length > 1
                                          ? 'text-green-600' 
                                          : ''
                                      }`}>
                                        MYR {quotationItem.unit_price.toFixed(2)}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        Total: MYR {quotationItem.total_price.toFixed(2)}
                                      </div>
                                      {quotationItem.brand && (
                                        <div className="text-xs text-muted-foreground">
                                          Brand: {quotationItem.brand}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">N/A</span>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                      
                      {/* Totals Row */}
                      <TableRow className="border-t-2">
                        <TableCell className="font-bold">Total Amount</TableCell>
                        {quotations.map((quotation) => (
                          <TableCell key={quotation.id} className="text-center font-bold">
                            MYR {quotation.total_amount.toFixed(2)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {quotations.map((quotation) => (
              <Card key={quotation.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                    <CardTitle className="flex items-center gap-2">
                      {quotation.supplier.supplier_name}
                        <Badge variant={getStatusBadgeVariant(quotation.status)}>
                          {quotation.status}
                        </Badge>
                      </CardTitle>
                      <div className="text-sm text-muted-foreground mt-1">
                        Quote #{quotation.quotation_number} • 
                        Dated {format(new Date(quotation.quotation_date), 'MMM dd, yyyy')}
                        {quotation.valid_until && (
                          <> • Valid until {format(new Date(quotation.valid_until), 'MMM dd, yyyy')}</>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {quotation.status === 'received' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleQuotationStatusUpdate(quotation.id, 'accepted')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuotationStatusUpdate(quotation.id, 'rejected', 'Rejected after review')}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      {quotation.status === 'accepted' && (
                        <Button
                          size="sm"
                          onClick={() => handleConvertToPO(quotation.id)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Convert to PO
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium">Total Amount</div>
                      <div className="text-lg font-bold">{quotation.currency} {quotation.total_amount.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Payment Terms</div>
                      <div>{quotation.payment_terms || 'Not specified'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Delivery Terms</div>
                      <div>{quotation.delivery_terms || 'Not specified'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Supplier Reference</div>
                      <div>{quotation.supplier_reference || 'N/A'}</div>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total Price</TableHead>
                        <TableHead>Delivery Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotation.quotation_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.item_description}</TableCell>
                          <TableCell>{item.brand || 'N/A'}</TableCell>
                          <TableCell>{item.quantity} {item.unit_of_measure}</TableCell>
                          <TableCell>{quotation.currency} {item.unit_price.toFixed(2)}</TableCell>
                          <TableCell>{quotation.currency} {item.total_price.toFixed(2)}</TableCell>
                          <TableCell>
                            {item.delivery_time_days ? `${item.delivery_time_days} days` : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}

            {quotations.length === 0 && (
              <Card>
                <CardContent className="text-center py-6">
                  <div className="text-muted-foreground">
                    No quotations received yet for this request.
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};