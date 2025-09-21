import { useState } from 'react';
import { Plus, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePurchaseOrders, Supplier } from '@/hooks/usePurchaseOrders';

export function SupplierManagement() {
  const { suppliers, createSupplier } = usePurchaseOrders();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    supplier_name: '',
    supplier_code: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    payment_terms: '30 days',
    notes: '',
    status: 'active' as 'active' | 'inactive'
  });

  const handleCreate = () => {
    setSelectedSupplier(null);
    setFormData({
      supplier_name: '',
      supplier_code: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      payment_terms: '30 days',
      notes: '',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createSupplier(formData);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving supplier:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Supplier Management</CardTitle>
              <CardDescription>Manage your suppliers and their contact information</CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Payment Terms</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.supplier_name}</TableCell>
                  <TableCell>{supplier.supplier_code || '-'}</TableCell>
                  <TableCell>{supplier.contact_person || '-'}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {supplier.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="h-3 w-3 mr-1" />
                          {supplier.phone}
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="h-3 w-3 mr-1" />
                          {supplier.email}
                        </div>
                      )}
                      {supplier.address && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {supplier.address.substring(0, 30)}...
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{supplier.payment_terms}</TableCell>
                  <TableCell>
                    <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                      {supplier.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier_name">Supplier Name *</Label>
                <Input
                  id="supplier_name"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="supplier_code">Supplier Code</Label>
                <Input
                  id="supplier_code"
                  value={formData.supplier_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier_code: e.target.value }))}
                  placeholder="Optional unique code"
                />
              </div>

              <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Select
                  value={formData.payment_terms}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, payment_terms: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Immediate">Immediate</SelectItem>
                    <SelectItem value="15 days">15 days</SelectItem>
                    <SelectItem value="30 days">30 days</SelectItem>
                    <SelectItem value="45 days">45 days</SelectItem>
                    <SelectItem value="60 days">60 days</SelectItem>
                    <SelectItem value="90 days">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Full address including postal code"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this supplier"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'active' | 'inactive' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !formData.supplier_name}>
                {loading ? 'Saving...' : (selectedSupplier ? 'Update' : 'Create')} Supplier
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}