import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PurchaseOrderDocument {
  id: string;
  purchase_order_id?: string;
  quotation_id?: string;
  supplier_id?: string;
  document_name: string;
  document_type: 'quotation' | 'purchase_order' | 'invoice' | 'delivery_note' | 'supplier_correspondence' | 'contract' | 'other';
  file_path: string;
  file_size?: number;
  mime_type?: string;
  version: number;
  is_active: boolean;
  metadata: any;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export function useDocumentManagement() {
  const [documents, setDocuments] = useState<PurchaseOrderDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDocuments = async (filters?: {
    purchase_order_id?: string;
    quotation_id?: string;
    supplier_id?: string;
    document_type?: string;
  }) => {
    try {
      setLoading(true);
      let query = supabase
        .from('purchase_order_documents')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters?.purchase_order_id) {
        query = query.eq('purchase_order_id', filters.purchase_order_id);
      }
      if (filters?.quotation_id) {
        query = query.eq('quotation_id', filters.quotation_id);
      }
      if (filters?.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }
      if (filters?.document_type) {
        query = query.eq('document_type', filters.document_type);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments((data || []) as PurchaseOrderDocument[]);
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
    documentData: Omit<PurchaseOrderDocument, 'id' | 'file_path' | 'file_size' | 'mime_type' | 'created_at' | 'updated_at'>
  ) => {
    try {
      setLoading(true);

      // For now, we'll create a placeholder file path since storage isn't implemented
      // In a real implementation, you would upload to Supabase Storage first
      const filePath = `documents/${documentData.document_type}/${Date.now()}_${file.name}`;

      const { data, error } = await supabase
        .from('purchase_order_documents')
        .insert({
          ...documentData,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });

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

  const updateDocument = async (id: string, updates: Partial<PurchaseOrderDocument>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('purchase_order_documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Document updated successfully',
      });

      return data;
    } catch (error: any) {
      console.error('Error updating document:', error);
      toast({
        title: 'Error',
        description: 'Failed to update document',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('purchase_order_documents')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });

      // Refresh documents
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

  return {
    documents,
    loading,
    fetchDocuments,
    uploadDocument,
    updateDocument,
    deleteDocument,
  };
}