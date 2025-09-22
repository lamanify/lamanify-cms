import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Package2, Building2, DollarSign, Truck, Filter } from 'lucide-react';
import { useWorkflowManagement, type SupplierCatalogItem } from '@/hooks/useWorkflowManagement';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useMedications } from '@/hooks/useMedications';

export const SupplierCatalogIntegration = () => {
  const { catalogItems, addCatalogItem, fetchCatalogItems, loading } = useWorkflowManagement();
  const { suppliers } = usePurchaseOrders();
  const { medications } = useMedications();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [formData, setFormData] = useState({
    supplier_id: '',
    medication_id: '',
    catalog_item_code: '',
    catalog_item_name: '',
    catalog_description: '',
    unit_price: '',
    minimum_order_quantity: '1',
    unit_of_measure: 'Each',
    pack_size: '1',
    manufacturer: '',
    brand_name: '',
    lead_time_days: '7',
    catalog_metadata: '{}'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const item: Omit<SupplierCatalogItem, 'id' | 'created_at' | 'updated_at'> = {
      supplier_id: formData.supplier_id,
      medication_id: formData.medication_id || null,
      catalog_item_code: formData.catalog_item_code,
      catalog_item_name: formData.catalog_item_name,
      catalog_description: formData.catalog_description || null,
      unit_price: parseFloat(formData.unit_price),
      minimum_order_quantity: parseInt(formData.minimum_order_quantity),
      unit_of_measure: formData.unit_of_measure,
      pack_size: parseInt(formData.pack_size),
      manufacturer: formData.manufacturer || null,
      brand_name: formData.brand_name || null,
      last_updated_price_date: new Date().toISOString().split('T')[0],
      is_available: true,
      lead_time_days: parseInt(formData.lead_time_days),
      catalog_metadata: {}
    };

    const success = await addCatalogItem(item);
    if (success) {
      setIsDialogOpen(false);
      setFormData({
        supplier_id: '',
        medication_id: '',
        catalog_item_code: '',
        catalog_item_name: '',
        catalog_description: '',
        unit_price: '',
        minimum_order_quantity: '1',
        unit_of_measure: 'Each',
        pack_size: '1',
        manufacturer: '',
        brand_name: '',
        lead_time_days: '7',
        catalog_metadata: '{}'
      });
    }
  };

  // Filter catalog items
  const filteredItems = catalogItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.catalog_item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.catalog_item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSupplier = !selectedSupplier || item.supplier_id === selectedSupplier;
    
    const matchesPrice = (!priceRange.min || item.unit_price >= parseFloat(priceRange.min)) &&
                        (!priceRange.max || item.unit_price <= parseFloat(priceRange.max));
    
    return matchesSearch && matchesSupplier && matchesPrice;
  });

  // Group items by supplier
  const itemsBySupplier = filteredItems.reduce((acc, item) => {
    const supplierName = item.supplier_name || 'Unknown Supplier';
    if (!acc[supplierName]) {
      acc[supplierName] = [];
    }
    acc[supplierName].push(item);
    return acc;
  }, {} as Record<string, SupplierCatalogItem[]>);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSupplier('');
    setPriceRange({ min: '', max: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Supplier Catalog</h2>
          <p className="text-muted-foreground">Browse and manage supplier product catalogs</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Catalog Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Catalog Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier_id">Supplier</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.supplier_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medication_id">Medication (Optional)</Label>
                  <Select
                    value={formData.medication_id}
                    onValueChange={(value) => setFormData({ ...formData, medication_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Link to medication" />
                    </SelectTrigger>
                    <SelectContent>
                      {medications.map((medication) => (
                        <SelectItem key={medication.id} value={medication.id}>
                          {medication.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="catalog_item_code">Catalog Code</Label>
                  <Input
                    id="catalog_item_code"
                    value={formData.catalog_item_code}
                    onChange={(e) => setFormData({ ...formData, catalog_item_code: e.target.value })}
                    placeholder="SKU/Product Code"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="catalog_item_name">Item Name</Label>
                  <Input
                    id="catalog_item_name"
                    value={formData.catalog_item_name}
                    onChange={(e) => setFormData({ ...formData, catalog_item_name: e.target.value })}
                    placeholder="Product name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="catalog_description">Description</Label>
                <Input
                  id="catalog_description"
                  value={formData.catalog_description}
                  onChange={(e) => setFormData({ ...formData, catalog_description: e.target.value })}
                  placeholder="Product description"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_price">Unit Price</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimum_order_quantity">Min Order Qty</Label>
                  <Input
                    id="minimum_order_quantity"
                    type="number"
                    min="1"
                    value={formData.minimum_order_quantity}
                    onChange={(e) => setFormData({ ...formData, minimum_order_quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pack_size">Pack Size</Label>
                  <Input
                    id="pack_size"
                    type="number"
                    min="1"
                    value={formData.pack_size}
                    onChange={(e) => setFormData({ ...formData, pack_size: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_of_measure">Unit of Measure</Label>
                  <Select
                    value={formData.unit_of_measure}
                    onValueChange={(value) => setFormData({ ...formData, unit_of_measure: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Each">Each</SelectItem>
                      <SelectItem value="Box">Box</SelectItem>
                      <SelectItem value="Bottle">Bottle</SelectItem>
                      <SelectItem value="Vial">Vial</SelectItem>
                      <SelectItem value="Pack">Pack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead_time_days">Lead Time (Days)</Label>
                  <Input
                    id="lead_time_days"
                    type="number"
                    min="1"
                    value={formData.lead_time_days}
                    onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="Manufacturer name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand_name">Brand Name</Label>
                  <Input
                    id="brand_name"
                    value={formData.brand_name}
                    onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                    placeholder="Brand/trade name"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  Add Item
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse Catalog</TabsTrigger>
          <TabsTrigger value="search">Advanced Search</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Quick Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All suppliers</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.supplier_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchTerm || selectedSupplier || priceRange.min || priceRange.max) && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>

          {/* Catalog Items by Supplier */}
          <div className="space-y-6">
            {Object.entries(itemsBySupplier).map(([supplierName, items]) => (
              <div key={supplierName} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{supplierName}</h3>
                  <Badge variant="outline">{items.length} items</Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{item.catalog_item_name}</CardTitle>
                            <CardDescription>Code: {item.catalog_item_code}</CardDescription>
                          </div>
                          <Badge variant="secondary" className="gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${item.unit_price}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {item.catalog_description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.catalog_description}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Min Order</p>
                            <p className="font-semibold">{item.minimum_order_quantity} {item.unit_of_measure}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Pack Size</p>
                            <p className="font-semibold">{item.pack_size}</p>
                          </div>
                        </div>

                        {item.manufacturer && (
                          <div className="text-sm">
                            <p className="text-muted-foreground">Manufacturer</p>
                            <p className="font-semibold">{item.manufacturer}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="h-3 w-3 text-muted-foreground" />
                          <span>{item.lead_time_days} days lead time</span>
                        </div>

                        {item.medication_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <Package2 className="h-3 w-3 text-primary" />
                            <span className="font-medium">Linked: {item.medication_name}</span>
                          </div>
                        )}

                        <Button className="w-full" size="sm">
                          Add to PO
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Catalog Items</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {catalogItems.length === 0 
                    ? "Start building your supplier catalog by adding product items."
                    : "No items match your current filters."
                  }
                </p>
                {catalogItems.length === 0 ? (
                  <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add First Item
                  </Button>
                ) : (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Advanced Search
              </CardTitle>
              <CardDescription>
                Use advanced filters to find specific catalog items
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Search Term</Label>
                  <Input
                    placeholder="Name, code, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger>
                      <SelectValue placeholder="All suppliers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All suppliers</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.supplier_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Price Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">
                  Found {filteredItems.length} items
                </p>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};