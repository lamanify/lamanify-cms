import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PanelClaimDocument {
  id: string;
  claim_id: string;
  document_name: string;
  document_type: 'supporting_document' | 'invoice' | 'receipt' | 'correspondence' | 'medical_report' | 'other';
  file_path: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: string;
  description?: string;
  is_required: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export function usePanelClaimDocuments(claimId?: string) {
  const [documents, setDocuments] = useState<PanelClaimDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDocuments = async (filters?: { claim_id?: string; document_type?: string }) => {
    try {
      setLoading(true);
      let query = supabase
        .from('panel_claim_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.claim_id || claimId) {
        query = query.eq('claim_id', filters?.claim_id || claimId);
      }
      if (filters?.document_type) {
        query = query.eq('document_type', filters.document_type);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments((data || []) as PanelClaimDocument[]);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (
    file: File,
    documentData: Omit<PanelClaimDocument, 'id' | 'file_path' | 'file_size' | 'mime_type' | 'created_at' | 'updated_at'>,
    onProgress?: (progress: number) => void
  ) => {
    try {
      setLoading(true);

      // Simulate progress for upload preparation
      onProgress?.(10);

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentData.claim_id}/${Date.now()}_${file.name}`;
      
      onProgress?.(20);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('panel-claim-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      onProgress?.(70);

      // Create document record
      const { data, error } = await supabase
        .from('panel_claim_documents')
        .insert({
          ...documentData,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (error) throw error;

      onProgress?.(90);

      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });

      onProgress?.(100);
      await fetchDocuments();
      return data;
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (document: PanelClaimDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('panel-claim-files')
        .download(document.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.document_name;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Document downloaded successfully',
      });
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Error',
        description: 'Failed to download document',
        variant: 'destructive',
      });
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      setLoading(true);
      
      // Get document info first
      const { data: docData } = await supabase
        .from('panel_claim_documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      // Delete file from storage
      if (docData?.file_path) {
        await supabase.storage
          .from('panel-claim-files')
          .remove([docData.file_path]);
      }

      // Delete document record
      const { error } = await supabase
        .from('panel_claim_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });

      await fetchDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (claimId) {
      fetchDocuments();
    }
  }, [claimId]);

  return {
    documents,
    loading,
    fetchDocuments,
    uploadDocument,
    downloadDocument,
    deleteDocument,
  };
}