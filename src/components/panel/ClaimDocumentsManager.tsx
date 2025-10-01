import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileIcon, Upload, Download, Trash2, Eye, Plus } from 'lucide-react';
import { usePanelClaimDocuments } from '@/hooks/usePanelClaimDocuments';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ClaimDocumentsManagerProps {
  claimId: string;
}

const DOCUMENT_TYPES = [
  { value: 'supporting_document', label: 'Supporting Document' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'medical_report', label: 'Medical Report' },
  { value: 'other', label: 'Other' },
];

const ALLOWED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ClaimDocumentsManager({ claimId }: ClaimDocumentsManagerProps) {
  const { documents, loading, uploadDocument, downloadDocument, deleteDocument } = usePanelClaimDocuments(claimId);
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    document_name: '',
    document_type: 'supporting_document' as const,
    description: '',
    is_required: false,
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, PNG, and JPG files are allowed",
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
    setUploadForm(prev => ({
      ...prev,
      document_name: file.name,
    }));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      await uploadDocument(
        selectedFile, 
        {
          claim_id: claimId,
          ...uploadForm,
          version: 1,
        },
        (progress) => setUploadProgress(progress)
      );
      
      toast({
        title: "Upload successful",
        description: "Document has been uploaded successfully",
      });

      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadProgress(0);
      setUploadForm({
        document_name: '',
        document_type: 'supporting_document',
        description: '',
        is_required: false,
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return FileIcon;
    
    if (mimeType.includes('pdf')) return FileIcon;
    if (mimeType.includes('image')) return FileIcon;
    if (mimeType.includes('word')) return FileIcon;
    return FileIcon;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      supporting_document: 'bg-blue-100 text-blue-800',
      invoice: 'bg-green-100 text-green-800',
      receipt: 'bg-yellow-100 text-yellow-800',
      correspondence: 'bg-purple-100 text-purple-800',
      medical_report: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.other;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Claim Documents</CardTitle>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file-upload">File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.png,.jpg,.jpeg"
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Allowed: PDF, PNG, JPG (max 10MB)
                </p>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="document-name">Document Name</Label>
                <Input
                  id="document-name"
                  value={uploadForm.document_name}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, document_name: e.target.value }))}
                  placeholder="Enter document name"
                  disabled={isUploading}
                />
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
              
              <div>
                <Label htmlFor="document-type">Document Type</Label>
                <Select value={uploadForm.document_type} onValueChange={(value: any) => setUploadForm(prev => ({ ...prev, document_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setUploadDialogOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No documents uploaded yet</p>
            <p className="text-sm">Upload documents to support this claim</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => {
              const IconComponent = getFileIcon(document.mime_type);
              return (
                <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <IconComponent className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{document.document_name}</h4>
                        <Badge className={getDocumentTypeColor(document.document_type)}>
                          {DOCUMENT_TYPES.find(t => t.value === document.document_type)?.label}
                        </Badge>
                        {document.is_required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(document.file_size)}</span>
                        <span>•</span>
                        <span>v{document.version}</span>
                        <span>•</span>
                        <span>{new Date(document.created_at).toLocaleDateString()}</span>
                      </div>
                      {document.description && (
                        <p className="text-sm text-muted-foreground mt-1">{document.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadDocument(document)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Document</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{document.document_name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteDocument(document.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}