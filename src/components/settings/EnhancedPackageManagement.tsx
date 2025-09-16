import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Package,
  AlertTriangle,
  ExternalLink,
  Check,
  ChevronsUpDown,
  X
} from 'lucide-react';
import { usePackages, type AvailableItem } from '@/hooks/usePackages';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface SelectedPackageItem {
  item_id: string;
  item_type: 'service' | 'inventory';
  name: string;
  unit_price: number;
  quantity: number;
  current_stock?: number;
  max_quantity?: number;
}

export function EnhancedPackageManagement() {
  const { packages, loading, availableItems, createPackage, updatePackage, deletePackage } = usePackages();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    package_name: '',
    package_price: 0,
  });
  const [selectedItems, setSelectedItems] = useState<SelectedPackageItem[]>([]);
  const [itemSearchOpen, setItemSearchOpen] = useState(false);

  const filteredPackages = useMemo(() => {
    let filtered = packages;

    // Filter by status
    if (activeTab !== 'all') {
      filtered = filtered.filter(pkg => 
        activeTab === 'active' ? pkg.status === 'active' : pkg.status === 'inactive'
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(pkg =>
        pkg.package_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [packages, activeTab, searchTerm]);

  const resetForm = () => {
    setFormData({ package_name: '', package_price: 0 });
    setSelectedItems([]);
    setEditingPackage(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (pkg: any) => {
    setEditingPackage(pkg);
    setFormData({
      package_name: pkg.package_name,
      package_price: pkg.package_price,
    });
    
    // Convert package items to selected items format
    const items: SelectedPackageItem[] = pkg.items.map((item: any) => ({
      item_id: item.item_id,
      item_type: item.item_type,
      name: item.name,
      unit_price: item.unit_price,
      quantity: item.quantity,
      current_stock: item.current_stock,
      max_quantity: item.current_stock
    }));
    setSelectedItems(items);
    setIsEditModalOpen(true);
  };

  const handleAddItem = (availableItem: AvailableItem) => {
    // Check if item already selected
    const existingIndex = selectedItems.findIndex(item => item.item_id === availableItem.id);
    
    if (existingIndex >= 0) {
      // Update quantity if already selected
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      
      // Check stock limits for inventory items
      if (availableItem.type === 'inventory' && updated[existingIndex].quantity > (availableItem.current_stock || 0)) {
        toast({
          variant: "destructive",
          title: "Stock Limit Exceeded",
          description: `Only ${availableItem.current_stock} units available`
        });
        return;
      }
      
      setSelectedItems(updated);
    } else {
      // Add new item
      const newItem: SelectedPackageItem = {
        item_id: availableItem.id,
        item_type: availableItem.type,
        name: availableItem.name,
        unit_price: availableItem.price,
        quantity: 1,
        current_stock: availableItem.current_stock,
        max_quantity: availableItem.current_stock
      };
      setSelectedItems([...selectedItems, newItem]);
    }
    setItemSearchOpen(false);
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter(item => item.item_id !== itemId));
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    const updated = selectedItems.map(item => {
      if (item.item_id === itemId) {
        // Validate stock for inventory items
        if (item.item_type === 'inventory' && newQuantity > (item.current_stock || 0)) {
          toast({
            variant: "destructive",
            title: "Stock Limit Exceeded", 
            description: `Only ${item.current_stock} units available`
          });
          return item;
        }
        return { ...item, quantity: Math.max(1, newQuantity) };
      }
      return item;
    });
    setSelectedItems(updated);
  };

  const calculateBundleValue = () => {
    return selectedItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    const bundleValue = calculateBundleValue();
    if (bundleValue === 0) return 0;
    return ((bundleValue - formData.package_price) / bundleValue) * 100;
  };

  const handleSubmit = async () => {
    if (!formData.package_name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Package name is required"
      });
      return;
    }

    if (selectedItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "At least one item must be selected"
      });
      return;
    }

    const packageData = {
      package_name: formData.package_name,
      package_price: formData.package_price,
      items: selectedItems.map(item => ({
        item_id: item.item_id,
        item_type: item.item_type,
        quantity: item.quantity,
        unit_price: item.unit_price
      }))
    };

    let success = false;
    if (editingPackage) {
      success = await updatePackage(editingPackage.id, packageData);
    } else {
      success = await createPackage(packageData);
    }

    if (success) {
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      resetForm();
    }
  };

  const handleDelete = async (packageId: string) => {
    if (confirm('Are you sure you want to delete this package?')) {
      await deletePackage(packageId);
    }
  };

  const handleStatusToggle = async (pkg: any) => {
    const newStatus = pkg.status === 'active' ? 'inactive' : 'active';
    await updatePackage(pkg.id, { status: newStatus });
  };

  const renderModal = (isEdit: boolean = false) => (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => isEdit ? setIsEditModalOpen(false) : setIsCreateModalOpen(false)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <DialogTitle>{isEdit ? 'Edit Package' : 'Add Package'}</DialogTitle>
        </div>
      </DialogHeader>

      <div className="space-y-6">
        {/* Package Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Package Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="package_name">Package Name *</Label>
              <Input
                id="package_name"
                value={formData.package_name}
                onChange={(e) => setFormData(prev => ({ ...prev, package_name: e.target.value }))}
                placeholder="Enter package name"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="package_price">Price (RM)</Label>
                <Input
                  id="package_price"
                  type="number"
                  step="0.01"
                  value={formData.package_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, package_price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Bundle Value (RM)</Label>
                <Input
                  value={calculateBundleValue().toFixed(2)}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div>
                <Label>Discount (%)</Label>
                <Input
                  value={calculateDiscount().toFixed(1)}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attach Inventory and Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attach Inventory and Services</CardTitle>
            <p className="text-sm text-muted-foreground">
              Search and select your inventory and services. You can set your quantity and price
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Item Search */}
            <Popover open={itemSearchOpen} onOpenChange={setItemSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={itemSearchOpen}
                  className="w-full justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Search and select here
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-background border shadow-lg z-50">
                <Command>
                  <CommandInput placeholder="Search services and inventory..." />
                  <CommandEmpty>No items found.</CommandEmpty>
                  <CommandList>
                    <CommandGroup heading="Available Items">
                      {availableItems.map((item) => (
                        <CommandItem
                          key={item.id}
                          onSelect={() => handleAddItem(item)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.type === 'service' ? 'Service' : 'Inventory'}
                                  {item.current_stock && ` - Stock: ${item.current_stock}`}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm font-medium text-green-600">
                              RM {item.price.toFixed(2)}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Selected Items Table */}
            {selectedItems.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NAME</TableHead>
                      <TableHead>TYPE</TableHead>
                      <TableHead>PRICE (RM)</TableHead>
                      <TableHead>STOCK</TableHead>
                      <TableHead>QUANTITY</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedItems.map((item) => (
                      <TableRow key={item.item_id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant={item.item_type === 'service' ? 'default' : 'secondary'}>
                            {item.item_type === 'service' ? 'Service' : 'Inventory'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-green-600">
                          RM {item.unit_price.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {item.item_type === 'service' ? '-' : item.current_stock}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            max={item.max_quantity}
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.item_id, parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.item_id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => isEdit ? setIsEditModalOpen(false) : setIsCreateModalOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-[#e9204f] hover:bg-[#d91d47] text-white"
          >
            {isEdit ? 'Update Package' : 'Create Package'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Packages</h2>
            <p className="text-muted-foreground">Manage service and inventory packages</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Loading packages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Packages</h2>
          <p className="text-muted-foreground">Manage service and inventory packages</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateModal} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Add Package
            </Button>
          </DialogTrigger>
          {renderModal(false)}
        </Dialog>
      </div>

      {/* Tabs and Filters */}
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Packages Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PACKAGE NAME</TableHead>
                <TableHead>BUNDLE PRICE</TableHead>
                <TableHead>ORIGINAL VALUE</TableHead>
                <TableHead>DISCOUNT %</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPackages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm ? 'No packages found matching your search.' : 'No packages created yet.'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPackages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.package_name}</TableCell>
                    <TableCell className="text-green-600">
                      RM {pkg.package_price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-green-600">
                      RM {pkg.bundle_value.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {pkg.discount_percentage ? pkg.discount_percentage.toFixed(1) + '%' : '0.0%'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={pkg.status === 'active' ? 'default' : 'secondary'}>
                        {pkg.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border shadow-md">
                          <DropdownMenuItem onClick={() => openEditModal(pkg)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusToggle(pkg)}>
                            <Package className="h-4 w-4 mr-2" />
                            {pkg.status === 'active' ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(pkg.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        {renderModal(true)}
      </Dialog>
    </div>
  );
}