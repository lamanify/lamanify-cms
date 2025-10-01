import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MessageSquare, Plus, Reply, Edit, Trash2, Clock, User } from 'lucide-react';
import { usePanelClaimNotes, type PanelClaimNote } from '@/hooks/usePanelClaimNotes';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ClaimNotesManagerProps {
  claimId: string;
}

const NOTE_CATEGORIES = [
  { value: 'internal', label: 'Internal Note', color: 'bg-blue-100 text-blue-800' },
  { value: 'panel_communication', label: 'Panel Communication', color: 'bg-green-100 text-green-800' },
  { value: 'follow_up', label: 'Follow-up', color: 'bg-yellow-100 text-yellow-800' },
];

const NOTE_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
];

const NOTE_VISIBILITY = [
  { value: 'internal', label: 'Internal Only' },
  { value: 'panel_shared', label: 'Shared with Panel' },
  { value: 'public', label: 'Public' },
];

export function ClaimNotesManager({ claimId }: ClaimNotesManagerProps) {
  const { notes, loading, createNote, updateNote, deleteNote } = usePanelClaimNotes(claimId);
  const { toast } = useToast();
  const [newNoteDialogOpen, setNewNoteDialogOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteForm, setNoteForm] = useState({
    content: '',
    note_category: 'internal' as const,
    priority: 'normal' as const,
    visibility: 'internal' as const,
  });

  const handleCreateNote = async () => {
    if (!noteForm.content.trim()) {
      toast({
        title: "Error",
        description: "Note content is required",
        variant: "destructive",
      });
      return;
    }

    if (noteForm.content.trim().length < 5) {
      toast({
        title: "Error",
        description: "Note must be at least 5 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      await createNote({
        claim_id: claimId,
        ...noteForm,
      });
      
      toast({
        title: "Success",
        description: "Note created successfully",
      });

      setNewNoteDialogOpen(false);
      setNoteForm({
        content: '',
        note_category: 'internal',
        priority: 'normal',
        visibility: 'internal',
      });
    } catch (error) {
      console.error('Failed to create note:', error);
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
    }
  };

  const handleReply = async (parentId: string, content: string) => {
    if (content.trim().length < 5) {
      toast({
        title: "Error",
        description: "Reply must be at least 5 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      await createNote({
        claim_id: claimId,
        content,
        note_category: 'internal',
        priority: 'normal',
        visibility: 'internal',
        parent_note_id: parentId,
      });
      
      toast({
        title: "Success",
        description: "Reply added successfully",
      });

      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to reply:', error);
      toast({
        title: "Error",
        description: "Failed to add reply",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (noteId: string, content: string) => {
    try {
      await updateNote(noteId, { content });
      setEditingNote(null);
    } catch (error) {
      console.error('Failed to edit note:', error);
    }
  };

  const getCategoryInfo = (category: string) => {
    return NOTE_CATEGORIES.find(c => c.value === category) || NOTE_CATEGORIES[0];
  };

  const getPriorityInfo = (priority: string) => {
    return NOTE_PRIORITIES.find(p => p.value === priority) || NOTE_PRIORITIES[1];
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const NoteItem = ({ note, level = 0 }: { note: PanelClaimNote; level?: number }) => {
    const [replyContent, setReplyContent] = useState('');
    const [editContent, setEditContent] = useState(note.content);
    
    const categoryInfo = getCategoryInfo(note.note_category);
    const priorityInfo = getPriorityInfo(note.priority);

    return (
      <div className={`${level > 0 ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
        <Card className="mb-3">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(note.created_by_profile?.first_name, note.created_by_profile?.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-sm">
                      {note.created_by_profile?.first_name} {note.created_by_profile?.last_name}
                    </p>
                    <Badge className={categoryInfo.color}>
                      {categoryInfo.label}
                    </Badge>
                    <Badge className={priorityInfo.color}>
                      {priorityInfo.label}
                    </Badge>
                    {note.is_system_generated && (
                      <Badge variant="secondary" className="text-xs">System</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDateTime(note.created_at)}</span>
                    {note.updated_at !== note.created_at && (
                      <>
                        <span>•</span>
                        <span>Edited {formatDateTime(note.updated_at)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {!note.is_system_generated && (
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReplyingTo(replyingTo === note.id ? null : note.id)}
                  >
                    <Reply className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingNote(editingNote === note.id ? null : note.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Note</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this note? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteNote(note.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
            
            {editingNote === note.id ? (
              <div className="space-y-3">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingNote(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleEdit(note.id, editContent)}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{note.content}</p>
              </div>
            )}
            
            {replyingTo === note.id && (
              <div className="mt-3 space-y-3 border-t pt-3">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleReply(note.id, replyContent)}
                    disabled={!replyContent.trim()}
                  >
                    Reply
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Render replies */}
        {note.replies?.map((reply) => (
          <NoteItem key={reply.id} note={reply} level={level + 1} />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Notes & Communication
        </CardTitle>
        <Dialog open={newNoteDialogOpen} onOpenChange={setNewNoteDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="note-category">Category</Label>
                <Select value={noteForm.note_category} onValueChange={(value: any) => setNoteForm(prev => ({ ...prev, note_category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="note-priority">Priority</Label>
                <Select value={noteForm.priority} onValueChange={(value: any) => setNoteForm(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_PRIORITIES.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="note-visibility">Visibility</Label>
                <Select value={noteForm.visibility} onValueChange={(value: any) => setNoteForm(prev => ({ ...prev, visibility: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_VISIBILITY.map((visibility) => (
                      <SelectItem key={visibility.value} value={visibility.value}>
                        {visibility.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="note-content">Note Content</Label>
                <Textarea
                  id="note-content"
                  value={noteForm.content}
                  onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your note..."
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setNewNoteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateNote} disabled={!noteForm.content.trim() || loading}>
                  Add Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notes added yet</p>
            <p className="text-sm">Add notes to track communication and follow-ups</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <NoteItem key={note.id} note={note} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}