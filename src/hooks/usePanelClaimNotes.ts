import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PanelClaimNote {
  id: string;
  claim_id: string;
  note_category: 'internal' | 'panel_communication' | 'follow_up' | 'system';
  content: string;
  visibility: 'internal' | 'panel_shared' | 'public';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  parent_note_id?: string;
  is_system_generated: boolean;
  metadata?: any;
  // Joined data - made optional since they might not be available
  created_by_profile?: {
    first_name?: string;
    last_name?: string;
  } | null;
  updated_by_profile?: {
    first_name?: string;
    last_name?: string;
  } | null;
  replies?: PanelClaimNote[];
}

export function usePanelClaimNotes(claimId?: string) {
  const [notes, setNotes] = useState<PanelClaimNote[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchNotes = async (filters?: { 
    claim_id?: string; 
    category?: string; 
    include_replies?: boolean;
  }) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('panel_claim_notes')
        .select(`
          *,
          created_by_profile:profiles!panel_claim_notes_created_by_fkey(first_name, last_name),
          updated_by_profile:profiles!panel_claim_notes_updated_by_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.claim_id || claimId) {
        query = query.eq('claim_id', filters?.claim_id || claimId);
      }
      if (filters?.category) {
        query = query.eq('note_category', filters.category);
      }
      if (!filters?.include_replies) {
        query = query.is('parent_note_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      // If including replies, organize notes hierarchically
      if (filters?.include_replies) {
        const notesMap = new Map();
        const rootNotes: PanelClaimNote[] = [];

        // First pass: create map and identify root notes
        (data || []).forEach((note: any) => {
          notesMap.set(note.id, { ...note, replies: [] });
          if (!note.parent_note_id) {
            rootNotes.push(notesMap.get(note.id));
          }
        });

        // Second pass: attach replies to parent notes
        (data || []).forEach((note: any) => {
          if (note.parent_note_id && notesMap.has(note.parent_note_id)) {
            notesMap.get(note.parent_note_id).replies.push(notesMap.get(note.id));
          }
        });

        setNotes(rootNotes);
      } else {
        setNotes((data || []) as unknown as PanelClaimNote[]);
      }
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch notes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (
    noteData: Omit<PanelClaimNote, 'id' | 'created_at' | 'updated_at' | 'is_system_generated' | 'created_by_profile' | 'updated_by_profile' | 'replies'>
  ) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('panel_claim_notes')
        .insert({
          ...noteData,
          is_system_generated: false,
        })
        .select(`
          *,
          created_by_profile:profiles!panel_claim_notes_created_by_fkey(first_name, last_name)
        `)
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note added successfully',
      });

      await fetchNotes();
      return data;
    } catch (error: any) {
      console.error('Error creating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to add note',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateNote = async (noteId: string, updates: Partial<PanelClaimNote>) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('panel_claim_notes')
        .update(updates)
        .eq('id', noteId)
        .select(`
          *,
          updated_by_profile:profiles!panel_claim_notes_updated_by_fkey(first_name, last_name)
        `)
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note updated successfully',
      });

      await fetchNotes();
      return data;
    } catch (error: any) {
      console.error('Error updating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to update note',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('panel_claim_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note deleted successfully',
      });

      await fetchNotes();
    } catch (error: any) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete note',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createSystemNote = async (claimId: string, content: string, metadata?: any) => {
    try {
      const { data, error } = await supabase
        .from('panel_claim_notes')
        .insert({
          claim_id: claimId,
          note_category: 'system',
          content,
          visibility: 'internal',
          priority: 'normal',
          is_system_generated: true,
          metadata,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchNotes();
      return data;
    } catch (error: any) {
      console.error('Error creating system note:', error);
    }
  };

  useEffect(() => {
    if (claimId) {
      fetchNotes({ include_replies: true });
    }
  }, [claimId]);

  return {
    notes,
    loading,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    createSystemNote,
  };
}