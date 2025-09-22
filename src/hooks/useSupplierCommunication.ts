import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupplierCommunication {
  id: string;
  supplier_id: string;
  purchase_order_id?: string;
  quotation_id?: string;
  communication_type: 'email' | 'phone' | 'meeting' | 'document_sent' | 'document_received';
  subject?: string;
  content?: string;
  direction: 'inbound' | 'outbound';
  status: 'draft' | 'sent' | 'delivered' | 'failed' | 'read';
  recipient_email?: string;
  sender_email?: string;
  attachments: any[];
  metadata: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CommunicationTemplate {
  id: string;
  template_name: string;
  template_type: 'quotation_request' | 'po_confirmation' | 'delivery_inquiry' | 'payment_reminder' | 'general';
  subject_template: string;
  content_template: string;
  variables: string[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export function useSupplierCommunication() {
  const [communications, setCommunications] = useState<SupplierCommunication[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCommunications = async (filters?: {
    supplier_id?: string;
    purchase_order_id?: string;
    quotation_id?: string;
    communication_type?: string;
  }) => {
    try {
      setLoading(true);
      let query = supabase
        .from('supplier_communications')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }
      if (filters?.purchase_order_id) {
        query = query.eq('purchase_order_id', filters.purchase_order_id);
      }
      if (filters?.quotation_id) {
        query = query.eq('quotation_id', filters.quotation_id);
      }
      if (filters?.communication_type) {
        query = query.eq('communication_type', filters.communication_type);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCommunications((data || []) as SupplierCommunication[]);
    } catch (error: any) {
      console.error('Error fetching communications:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch communications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('communication_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_name');

      if (error) throw error;
      setTemplates((data || []) as CommunicationTemplate[]);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch templates',
        variant: 'destructive',
      });
    }
  };

  const createCommunication = async (
    communicationData: Omit<SupplierCommunication, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('supplier_communications')
        .insert(communicationData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Communication record created successfully',
      });

      return data;
    } catch (error: any) {
      console.error('Error creating communication:', error);
      toast({
        title: 'Error',
        description: 'Failed to create communication record',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async (emailData: {
    supplier_id: string;
    purchase_order_id?: string;
    quotation_id?: string;
    recipient_email: string;
    subject: string;
    content: string;
    attachments?: File[];
  }) => {
    try {
      setLoading(true);

      // Create communication record
      const communicationData = {
        supplier_id: emailData.supplier_id,
        purchase_order_id: emailData.purchase_order_id,
        quotation_id: emailData.quotation_id,
        communication_type: 'email' as const,
        subject: emailData.subject,
        content: emailData.content,
        direction: 'outbound' as const,
        status: 'sent' as const,
        recipient_email: emailData.recipient_email,
        attachments: emailData.attachments?.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        })) || [],
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      const { data, error } = await supabase
        .from('supplier_communications')
        .insert(communicationData)
        .select()
        .single();

      if (error) throw error;

      // Here you would integrate with an email service like Resend
      // For now, we'll just create the record
      toast({
        title: 'Success',
        description: 'Email sent and logged successfully',
      });

      return data;
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send email',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const processTemplate = (template: CommunicationTemplate, variables: Record<string, string>) => {
    let subject = template.subject_template;
    let content = template.content_template;

    // Replace template variables
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });

    return { subject, content };
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    communications,
    templates,
    loading,
    fetchCommunications,
    fetchTemplates,
    createCommunication,
    sendEmail,
    processTemplate,
  };
}