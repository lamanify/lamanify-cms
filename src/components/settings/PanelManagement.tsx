import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Edit, Trash2, Shield, ExternalLink, FileText, Users } from 'lucide-react';
import { usePanels, Panel } from '@/hooks/usePanels';
import { PanelModal } from './PanelModal';
import { format } from 'date-fns';

export function PanelManagement() {
  const { panels, loading, createPanel, updatePanel, deletePanel } = usePanels();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPanel, setEditingPanel] = useState<Panel | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [panelToDelete, setPanelToDelete] = useState<Panel | null>(null);

  const filteredPanels = panels.filter(panel =>
    panel.panel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    panel.panel_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (panel.person_in_charge_name && panel.person_in_charge_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (data: any) => {
    if (editingPanel) {
      return await updatePanel(editingPanel.id, data);
    } else {
      return await createPanel(data);
    }
  };

  const handleEdit = (panel: Panel) => {
    setEditingPanel(panel);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (panelToDelete) {
      await deletePanel(panelToDelete.id);
      setDeleteConfirmOpen(false);
      setPanelToDelete(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPanel(null);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Panel Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading panels...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Panel Management
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Manage corporate, TPA, and insurance panels for billing and patient registration
              </p>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Panel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by panel name, code, or person in charge..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {filteredPanels.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No panels found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No panels match your search criteria.' : 'Get started by adding your first panel.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Panel
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Panel Name</TableHead>
                    <TableHead>Panel Code</TableHead>
                    <TableHead>Person in Charge</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price Tiers</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPanels.map((panel) => (
                    <TableRow key={panel.id}>
                      <TableCell className="font-medium">
                        {panel.panel_name}
                      </TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-muted rounded text-sm">
                          {panel.panel_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{panel.person_in_charge_name || 'Not assigned'}</div>
                          {panel.person_in_charge_phone && (
                            <div className="text-sm text-muted-foreground">
                              {panel.person_in_charge_phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={panel.default_status === 'active' ? 'default' : 'secondary'}>
                          {panel.default_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {panel.price_tiers && panel.price_tiers.length > 0 ? (
                            panel.price_tiers.map((tier) => (
                              <Badge key={tier.id} variant="outline" className="text-xs">
                                {tier.tier_name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">No tiers</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {panel.verification_method === 'url' ? (
                            <>
                              <ExternalLink className="h-3 w-3" />
                              <span className="text-xs">URL</span>
                            </>
                          ) : (
                            <>
                              <FileText className="h-3 w-3" />
                              <span className="text-xs">Manual</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(panel.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(panel)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPanelToDelete(panel);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PanelModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleSubmit}
        editingPanel={editingPanel}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Panel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{panelToDelete?.panel_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}