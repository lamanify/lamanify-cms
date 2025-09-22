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
import { useDocumentManagement, PurchaseOrderDocument } from '@/hooks/useDocumentManagement';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Edit,
  Filter,
  Search,
  File
} from 'lucide-react';
import { format } from 'date-fns';

interface DocumentManagerProps {
  supplierId?: string;
  purchaseOrderId?: string;
  quotationId?: string;
}

const documentTypeLabels = {
  quotation: 'Quotation',
  purchase_order: 'Purchase Order',
  invoice: 'Invoice',
  delivery_note: 'Delivery Note',
  supplier_correspondence: 'Correspondence',
  contract: 'Contract',
  other: 'Other'
};

const documentTypeColors = {
  quotation: 'bg-blue-100 text-blue-800',
  purchase_order: 'bg-green-100 text-green-800',
  invoice: 'bg-yellow-100 text-yellow-800',
  delivery_note: 'bg-purple-100 text-purple-800',
  supplier_correspondence: 'bg-gray-100 text-gray-800',
  contract: 'bg-red-100 text-red-800',
  other: 'bg-slate-100 text-slate-800'
};

export function DocumentManager({ supplierId, purchaseOrderId, quotationId }: DocumentManagerProps) {
  const { documents, loading, fetchDocuments, uploadDocument, deleteDocument } = useDocumentManagement();
  const { suppliers } = usePurchaseOrders();
  const { toast } = useToast();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    document_name: '',
    document_type: 'other' as const,
    supplier_id: supplierId || '',
    purchase_order_id: purchaseOrderId || '',
    quotation_id: quotationId || '',
    metadata: {}
  });

  const [filters, setFilters] = useState({
    document_type: '',
    search: ''
  });

  useEffect(() => {
    fetchDocuments({
      supplier_id: supplierId,
      purchase_order_id: purchaseOrderId,
      quotation_id: quotationId
    });
  }, [supplierId, purchaseOrderId, quotationId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadData(prev => ({
        ...prev,
        document_name: file.name.split('.')[0]
      }));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive'
      });
      return;
    }

    try {
      await uploadDocument(selectedFile, {
        ...uploadData,
        version: 1,
        is_active: true,
        metadata: {}
      });
      
      setIsUploadOpen(false);
      setSelectedFile(null);
      setUploadData({
        document_name: '',
        document_type: 'other',
        supplier_id: supplierId || '',
        purchase_order_id: purchaseOrderId || '',
        quotation_id: quotationId || '',
        metadata: {}
      });
      
      // Refresh documents
      fetchDocuments({
        supplier_id: supplierId,
        purchase_order_id: purchaseOrderId,
        quotation_id: quotationId
      });
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(id);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesType = !filters.document_type || doc.document_type === filters.document_type;
    const matchesSearch = !filters.search || 
      doc.document_name.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  const getDocumentIcon = (mimeType?: string) => {
    if (!mimeType) return <File className="h-4 w-4" />;
    
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (mimeType.includes('image')) return <File className="h-4 w-4 text-blue-500" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <File className="h-4 w-4 text-green-500" />;
    if (mimeType.includes('document') || mimeType.includes('word')) return <File className="h-4 w-4 text-blue-600" />;
    
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Document Management</h3>
          <p className="text-muted-foreground">
            Manage documents for suppliers, purchase orders, and quotations
          </p>
        </div>
        
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                />
              </div>
              
              <div>
                <Label htmlFor="document_name">Document Name</Label>
                <Input
                  id="document_name"
                  value={uploadData.document_name}
                  onChange={(e) => setUploadData(prev => ({ ...prev, document_name: e.target.value }))}
                  placeholder="Enter document name"
                />
              </div>
              
              <div>
                <Label htmlFor="document_type">Document Type</Label>
                <Select
                  value={uploadData.document_type}
                  onValueChange={(value: any) => setUploadData(prev => ({ ...prev, document_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(documentTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {!supplierId && (
                <div>
                  <Label htmlFor="supplier">Supplier (Optional)</Label>
                  <Select
                    value={uploadData.supplier_id}
                    onValueChange={(value) => setUploadData(prev => ({ ...prev, supplier_id: value }))}
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
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpload} disabled={loading || !selectedFile}>
                  {loading ? 'Uploading...' : 'Upload'}
                </Button>
                <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
              <Label>Search Documents</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search by document name..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-48">
              <Label>Document Type</Label>
              <Select
                value={filters.document_type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, document_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {Object.entries(documentTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading documents...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No documents found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDocumentIcon(document.mime_type)}
                        <div>
                          <div className="font-medium">{document.document_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {document.mime_type}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={documentTypeColors[document.document_type]}>
                        {documentTypeLabels[document.document_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(document.file_size)}</TableCell>
                    <TableCell>v{document.version}</TableCell>
                    <TableCell>{format(new Date(document.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(document.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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