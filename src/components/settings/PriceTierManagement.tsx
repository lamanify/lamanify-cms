import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Plus } from 'lucide-react';
import { usePriceTiers, type PriceTier } from '@/hooks/usePriceTiers';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PriceTierModal } from './PriceTierModal';


export function PriceTierManagement() {
  const { priceTiers, loading, createPriceTier, updatePriceTier, deletePriceTier } = usePriceTiers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<PriceTier | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<string | null>(null);

  const handleSubmit = async (data: { tier_name: string; description?: string; payment_methods: string[]; panel_ids: string[] }) => {
    let success = false;
    
    if (editingTier) {
      success = await updatePriceTier(editingTier.id, data);
    } else {
      success = await createPriceTier(data);
    }

    return success;
  };

  const handleEdit = (tier: PriceTier) => {
    setEditingTier(tier);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (tierToDelete) {
      await deletePriceTier(tierToDelete);
      setDeleteConfirmOpen(false);
      setTierToDelete(null);
    }
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      setEditingTier(null);
    }
    setIsModalOpen(open);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Price Tier Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage different pricing structures for services and medications
          </p>
        </div>
        <Button 
          className="bg-[#e9204f] hover:bg-[#e9204f]/90 text-white"
          onClick={() => {
            setEditingTier(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Price Tier
        </Button>

        <PriceTierModal
          open={isModalOpen}
          onOpenChange={handleModalClose}
          editingTier={editingTier}
          onSubmit={handleSubmit}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Price Tiers</CardTitle>
          <CardDescription>
            Manage your clinic's pricing structure for different patient categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading price tiers...</div>
          ) : priceTiers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No price tiers configured yet. Add your first tier to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier Name</TableHead>
                  <TableHead>Payment Methods</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceTiers.map((tier) => (
                  <TableRow key={tier.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{tier.tier_name}</div>
                        {tier.description && (
                          <div className="text-sm text-muted-foreground">
                            {tier.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {tier.payment_methods && tier.payment_methods.length > 0 
                        ? tier.payment_methods.join(', ') 
                        : 'No payment methods'
                      }
                    </TableCell>
                    <TableCell>{format(new Date(tier.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(tier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTierToDelete(tier.id);
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
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the price tier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}