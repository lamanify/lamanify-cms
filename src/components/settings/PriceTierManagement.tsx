import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePriceTiers, type PriceTier } from '@/hooks/usePriceTiers';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const priceTierSchema = z.object({
  tier_name: z.string().min(1, 'Tier name is required'),
  description: z.string().optional(),
  payment_method: z.enum(['Self-Pay', 'Insurance', 'Corporate', 'Government Panel'], {
    required_error: 'Payment method is required'
  })
});

type PriceTierFormData = z.infer<typeof priceTierSchema>;

export function PriceTierManagement() {
  const { priceTiers, loading, createPriceTier, updatePriceTier, deletePriceTier } = usePriceTiers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<PriceTier | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<string | null>(null);

  const form = useForm<PriceTierFormData>({
    resolver: zodResolver(priceTierSchema),
    defaultValues: {
      tier_name: '',
      description: '',
      payment_method: 'Self-Pay'
    }
  });

  const handleSubmit = async (data: PriceTierFormData) => {
    let success = false;
    
    if (editingTier) {
      success = await updatePriceTier(editingTier.id, data);
    } else {
      // For create, ensure we have all required fields
      const createData = {
        tier_name: data.tier_name,
        description: data.description,
        payment_method: data.payment_method
      };
      success = await createPriceTier(createData);
    }

    if (success) {
      setIsDialogOpen(false);
      setEditingTier(null);
      form.reset();
    }
  };

  const handleEdit = (tier: PriceTier) => {
    setEditingTier(tier);
    form.reset({
      tier_name: tier.tier_name,
      description: tier.description || '',
      payment_method: tier.payment_method
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (tierToDelete) {
      await deletePriceTier(tierToDelete);
      setDeleteConfirmOpen(false);
      setTierToDelete(null);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingTier(null);
    form.reset();
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-[#e9204f] hover:bg-[#e9204f]/90 text-white"
              onClick={() => {
                setEditingTier(null);
                form.reset();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Price Tier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTier ? 'Edit Price Tier' : 'Add New Price Tier'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="tier_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tier Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Self-Pay, AIA, Panel Group A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the tier" 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Self-Pay">Self-Pay</SelectItem>
                          <SelectItem value="Insurance">Insurance</SelectItem>
                          <SelectItem value="Corporate">Corporate</SelectItem>
                          <SelectItem value="Government Panel">Government Panel</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTier ? 'Update' : 'Save'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
                  <TableHead>Linked Payment Method</TableHead>
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
                    <TableCell>{tier.payment_method}</TableCell>
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