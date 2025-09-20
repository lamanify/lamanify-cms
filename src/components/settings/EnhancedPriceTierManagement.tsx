import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Trash2, Plus, MoreHorizontal } from 'lucide-react';
import { usePriceTiers, type PriceTier } from '@/hooks/usePriceTiers';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PriceTierModal } from './PriceTierModal';

export function EnhancedPriceTierManagement() {
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

  const formatPaymentMethods = (tier: PriceTier) => {
    const paymentMethods = tier.payment_methods || [];
    
    if (paymentMethods.length === 0) {
      return 'No payment methods configured';
    }

    // Count panel vs self-pay methods
    const panelMethods = paymentMethods.filter(method => 
      ['panel', 'pm_care', 'pm_care_pnb', 'madani', 'nestle', 'pmcare', 'medkad', 'aia', 'koperasi_guru', 'etiqa'].includes(method)
    );
    const selfPayMethods = paymentMethods.filter(method => 
      ['credit_card', 'voucher', 'e_wallet', 'qr_pay', 'cash', 'card'].includes(method)  
    );

    const parts = [];
    
    if (panelMethods.length > 0) {
      parts.push(`Panel: ${panelMethods.length} included`);
    } else {
      parts.push('Panel: None included');
    }
    
    if (selfPayMethods.length > 0) {
      parts.push(`Self-Pay: ${selfPayMethods.length} included`);
    } else {
      parts.push('Self-Pay: None included');
    }

    return parts.join('\n');
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
            Create comprehensive pricing groups by mapping tiers to multiple payment methods and panels
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
            Manage your clinic's pricing structure with comprehensive payment method groupings
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
                  <TableHead className="w-[200px]">NAME</TableHead>
                  <TableHead className="w-[400px]">PAYMENT METHODS</TableHead>
                  <TableHead className="w-[120px]">STATUS</TableHead>
                  <TableHead className="w-[100px] text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceTiers.map((tier) => {
                  return (
                    <TableRow key={tier.id}>
                      <TableCell className="font-medium">
                        {tier.tier_name}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground whitespace-pre-line">
                          {formatPaymentMethods(tier)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Active</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(tier)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setTierToDelete(tier.id);
                                setDeleteConfirmOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
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