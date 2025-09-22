import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupplierCommunication, SupplierCommunication as CommunicationType } from '@/hooks/useSupplierCommunication';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/useCurrency';
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  Send, 
  Users,
  Calendar,
  FileText,
  Filter,
  Search,
  Eye,
  Reply
} from 'lucide-react';
import { format } from 'date-fns';

interface SupplierCommunicationProps {
  supplierId?: string;
  purchaseOrderId?: string;
  quotationId?: string;
}

const communicationTypeLabels = {
  email: 'Email',
  phone: 'Phone Call',
  meeting: 'Meeting',
  document_sent: 'Document Sent',
  document_received: 'Document Received'
};

const communicationTypeIcons = {
  email: Mail,
  phone: Phone,
  meeting: Users,
  document_sent: Send,
  document_received: FileText
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  read: 'bg-purple-100 text-purple-800'
};

export function SupplierCommunication({ supplierId, purchaseOrderId, quotationId }: SupplierCommunicationProps) {
  const { formatCurrency } = useCurrency();
  const { 
    communications, 
    templates, 
    loading, 
    fetchCommunications, 
    sendEmail, 
    processTemplate,
    createCommunication
  } = useSupplierCommunication();
  const { suppliers, purchaseOrders } = usePurchaseOrders();
  const { toast } = useToast();

  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isCommunicationOpen, setIsCommunicationOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const [emailData, setEmailData] = useState({
    supplier_id: supplierId || '',
    purchase_order_id: purchaseOrderId || '',
    quotation_id: quotationId || '',
    recipient_email: '',
    subject: '',
    content: ''
  });

  const [communicationData, setCommunicationData] = useState({
    supplier_id: supplierId || '',
    purchase_order_id: purchaseOrderId || '',
    quotation_id: quotationId || '',
    communication_type: 'phone' as const,
    subject: '',
    content: '',
    direction: 'outbound' as const,
    status: 'sent' as const,
    attachments: [],
    metadata: {}
  });

  const [filters, setFilters] = useState({
    communication_type: '',
    direction: '',
    search: ''
  });

  useEffect(() => {
    fetchCommunications({
      supplier_id: supplierId,
      purchase_order_id: purchaseOrderId,
      quotation_id: quotationId
    });
  }, [supplierId, purchaseOrderId, quotationId]);

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    // Get supplier and PO data for template variables
    const supplier = suppliers.find(s => s.id === emailData.supplier_id);
    const purchaseOrder = purchaseOrders.find(po => po.id === emailData.purchase_order_id);

    const variables = {
      supplier_contact: supplier?.supplier_name || 'Supplier',
      po_number: purchaseOrder?.po_number || 'N/A',
      order_date: purchaseOrder?.order_date ? format(new Date(purchaseOrder.order_date), 'MMM dd, yyyy') : 'N/A',
      delivery_date: purchaseOrder?.expected_delivery_date ? format(new Date(purchaseOrder.expected_delivery_date), 'MMM dd, yyyy') : 'N/A',
      expected_delivery_date: purchaseOrder?.expected_delivery_date ? format(new Date(purchaseOrder.expected_delivery_date), 'MMM dd, yyyy') : 'N/A',
      total_amount: purchaseOrder?.total_amount ? formatCurrency(purchaseOrder.total_amount) : formatCurrency(0),
      sender_name: 'Clinic Staff',
      clinic_name: 'Medical Clinic',
      item_list: 'Items to be provided'
    };

    const processed = processTemplate(template, variables);
    setEmailData(prev => ({
      ...prev,
      subject: processed.subject,
      content: processed.content
    }));
  };

  const handleSendEmail = async () => {
    if (!emailData.recipient_email || !emailData.subject || !emailData.content) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      await sendEmail(emailData);
      setIsEmailOpen(false);
      setEmailData({
        supplier_id: supplierId || '',
        purchase_order_id: purchaseOrderId || '',
        quotation_id: quotationId || '',
        recipient_email: '',
        subject: '',
        content: ''
      });
      setSelectedTemplate('');
      
      // Refresh communications
      fetchCommunications({
        supplier_id: supplierId,
        purchase_order_id: purchaseOrderId,
        quotation_id: quotationId
      });
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  const handleCreateCommunication = async () => {
    if (!communicationData.content) {
      toast({
        title: 'Error',
        description: 'Please provide communication details',
        variant: 'destructive'
      });
      return;
    }

    try {
      await createCommunication(communicationData);
      setIsCommunicationOpen(false);
      setCommunicationData({
        supplier_id: supplierId || '',
        purchase_order_id: purchaseOrderId || '',
        quotation_id: quotationId || '',
        communication_type: 'phone',
        subject: '',
        content: '',
        direction: 'outbound',
        status: 'sent',
        attachments: [],
        metadata: {}
      });
      
      // Refresh communications
      fetchCommunications({
        supplier_id: supplierId,
        purchase_order_id: purchaseOrderId,
        quotation_id: quotationId
      });
    } catch (error) {
      console.error('Failed to create communication:', error);
    }
  };

  const filteredCommunications = communications.filter(comm => {
    const matchesType = !filters.communication_type || comm.communication_type === filters.communication_type;
    const matchesDirection = !filters.direction || comm.direction === filters.direction;
    const matchesSearch = !filters.search || 
      (comm.subject && comm.subject.toLowerCase().includes(filters.search.toLowerCase())) ||
      (comm.content && comm.content.toLowerCase().includes(filters.search.toLowerCase()));
    
    return matchesType && matchesDirection && matchesSearch;
  });

  const getCommunicationIcon = (type: string) => {
    const Icon = communicationTypeIcons[type as keyof typeof communicationTypeIcons] || MessageSquare;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Supplier Communication</h3>
          <p className="text-muted-foreground">
            Manage communications with suppliers
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isEmailOpen} onOpenChange={setIsEmailOpen}>
            <DialogTrigger asChild>
              <Button>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send Email</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {templates.length > 0 && (
                  <div>
                    <Label>Email Template (Optional)</Label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.template_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {!supplierId && (
                  <div>
                    <Label>Supplier *</Label>
                    <Select
                      value={emailData.supplier_id}
                      onValueChange={(value) => {
                        setEmailData(prev => ({ ...prev, supplier_id: value }));
                        const supplier = suppliers.find(s => s.id === value);
                        if (supplier?.email) {
                          setEmailData(prev => ({ ...prev, recipient_email: supplier.email || '' }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.supplier_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <Label>Recipient Email *</Label>
                  <Input
                    type="email"
                    value={emailData.recipient_email}
                    onChange={(e) => setEmailData(prev => ({ ...prev, recipient_email: e.target.value }))}
                    placeholder="supplier@example.com"
                  />
                </div>
                
                <div>
                  <Label>Subject *</Label>
                  <Input
                    value={emailData.subject}
                    onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Email subject"
                  />
                </div>
                
                <div>
                  <Label>Message *</Label>
                  <Textarea
                    value={emailData.content}
                    onChange={(e) => setEmailData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Email content"
                    rows={8}
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSendEmail} disabled={loading}>
                    {loading ? 'Sending...' : 'Send Email'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEmailOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCommunicationOpen} onOpenChange={setIsCommunicationOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Log Communication
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Communication</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Communication Type</Label>
                  <Select
                    value={communicationData.communication_type}
                    onValueChange={(value: any) => setCommunicationData(prev => ({ ...prev, communication_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(communicationTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Direction</Label>
                  <Select
                    value={communicationData.direction}
                    onValueChange={(value: any) => setCommunicationData(prev => ({ ...prev, direction: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outbound">Outbound (We contacted them)</SelectItem>
                      <SelectItem value="inbound">Inbound (They contacted us)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Subject</Label>
                  <Input
                    value={communicationData.subject}
                    onChange={(e) => setCommunicationData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Communication subject"
                  />
                </div>
                
                <div>
                  <Label>Details *</Label>
                  <Textarea
                    value={communicationData.content}
                    onChange={(e) => setCommunicationData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Communication details"
                    rows={4}
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateCommunication} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Communication'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsCommunicationOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Search Communications</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search by subject or content..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-48">
              <Label>Communication Type</Label>
              <Select
                value={filters.communication_type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, communication_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {Object.entries(communicationTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-40">
              <Label>Direction</Label>
              <Select
                value={filters.direction}
                onValueChange={(value) => setFilters(prev => ({ ...prev, direction: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Communication History ({filteredCommunications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading communications...</div>
          ) : filteredCommunications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No communications found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommunications.map((communication) => (
                  <TableRow key={communication.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getCommunicationIcon(communication.communication_type)}
                        {communicationTypeLabels[communication.communication_type]}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{communication.subject || 'No subject'}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {communication.content}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={communication.direction === 'outbound' ? 'default' : 'secondary'}>
                        {communication.direction === 'outbound' ? 'Outbound' : 'Inbound'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[communication.status]}>
                        {communication.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(communication.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {communication.communication_type === 'email' && (
                          <Button size="sm" variant="ghost">
                            <Reply className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}