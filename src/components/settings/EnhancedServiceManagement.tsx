import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Search, MoreHorizontal, Info, ArrowRight, Package } from 'lucide-react';
import { useServices, ServiceWithPricing } from '@/hooks/useServices';
import { usePriceTiers } from '@/hooks/usePriceTiers';
import { useForm } from 'react-hook-form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ServiceFormData {
  name: string;
  service_type: string;
  description: string;
  cost_price: number;
  pricing: { [tierId: string]: number };
}

type FilterType = 'all' | 'service' | 'procedure' | 'investigation' | 'consultation' | 'archived';

export function EnhancedServiceManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceWithPricing | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterType>('all');
  const [filterChips, setFilterChips] = useState<string[]>([]);
  const { services, loading, createService, updateService, deleteService } = useServices();
  const { priceTiers } = usePriceTiers();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ServiceFormData>({
    defaultValues: {
      name: '',
      service_type: 'Service',
      description: '',
      cost_price: 0,
      pricing: {}
    }
  });

  const watchPricing = watch('pricing');

  // Filter services based on active tab and search term
  const filteredServices = services.filter(service => {
    // Filter by tab
    let matchesTab = true;
    if (activeTab !== 'all') {
      if (activeTab === 'archived') {
        matchesTab = service.status === 'Archived';
      } else {
        matchesTab = service.service_type?.toLowerCase() === activeTab;
      }
    }

    // Filter by search term
    const matchesSearch = !searchTerm || 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.service_type?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const openCreateDialog = () => {
    setEditingService(null);
    reset({
      name: '',
      service_type: 'Service',
      description: '',
      cost_price: 0,
      pricing: {}
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: ServiceWithPricing) => {
    setEditingService(service);
    reset({
      name: service.name,
      service_type: service.service_type || 'Service',
      description: service.description || '',
      cost_price: service.cost_price || 0,
      pricing: service.pricing
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: ServiceFormData) => {
    const serviceData = {
      name: data.name,
      category: data.service_type, // Keep compatibility with old category field
      service_type: data.service_type,
      description: data.description,
      cost_price: data.cost_price,
      pricing: data.pricing,
      status: 'Active'
    };

    const success = editingService 
      ? await updateService(editingService.id, serviceData)
      : await createService(serviceData);
    
    if (success) {
      setIsDialogOpen(false);
      reset();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      await deleteService(id);
    }
  };

  const toggleStatus = async (service: ServiceWithPricing) => {
    const newStatus = service.status === 'Active' ? 'Inactive' : 'Active';
    await updateService(service.id, { status: newStatus });
  };

  const getPriceRange = (service: ServiceWithPricing) => {
    const prices = Object.values(service.pricing).filter(price => price > 0);
    if (prices.length === 0) return 'RM 0.00 - RM 0.00';
    if (prices.length === 1) return `RM 0.00 - RM ${prices[0].toFixed(2)}`;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return `RM ${min.toFixed(2)} - RM ${max.toFixed(2)}`;
  };

  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Inactive': return 'secondary';
      case 'Archived': return 'outline';
      default: return 'default';
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterChips([]);
    setActiveTab('all');
  };

  if (priceTiers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Services</h2>
            <p className="text-muted-foreground">Manage medical services with multi-tier pricing</p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Create Price Tiers First</h3>
            <p className="text-muted-foreground text-center mb-4">
              You need to create price tiers before you can manage services with pricing.
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Go to Settings → Price Tier Management to create your first price tier.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Services</h2>
            <p className="text-muted-foreground">Manage medical services with comprehensive pricing</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={openCreateDialog} className="gap-2" style={{ backgroundColor: '#e9204f' }}>
            <Plus className="h-4 w-4" />
            Create service
          </Button>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsDialogOpen(false)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle>
                  {editingService ? 'Edit service' : 'Create service'}
                </DialogTitle>
              </div>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Service Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Service Details</h3>
                
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    {...register('name', { required: 'Service name is required' })}
                    placeholder="e.g., Ultrasound"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="service_type">Type *</Label>
                  <Select onValueChange={(value) => setValue('service_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Service">Service</SelectItem>
                      <SelectItem value="Procedure">Procedure</SelectItem>
                      <SelectItem value="Investigation">Investigation</SelectItem>
                      <SelectItem value="Consultation">Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Optional description of the service"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="cost_price">Cost (RM) *</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('cost_price', { 
                      required: 'Cost is required',
                      valueAsNumber: true 
                    })}
                    placeholder="0.00"
                  />
                  {errors.cost_price && (
                    <p className="text-sm text-destructive mt-1">{errors.cost_price.message}</p>
                  )}
                </div>
              </div>

              {/* Pricing Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Pricing</h3>
                  <p className="text-sm text-muted-foreground">
                    Set default pricing tier for this item. You can manage your pricing tier in settings.
                  </p>
                  <Button variant="link" className="p-0 h-auto text-sm">
                    Go to pricing tier setting
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>NAME</TableHead>
                        <TableHead>PAYMENT METHODS</TableHead>
                        <TableHead>PRICE</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {priceTiers.map((tier) => (
                        <TableRow key={tier.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {tier.tier_name}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Pricing tier information</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {tier.description || 'Panel: None included, Self-Pay: 4 included'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">RM</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...register(`pricing.${tier.id}`, { 
                                  valueAsNumber: true,
                                  setValueAs: (value) => value || 0
                                })}
                                className="w-24"
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" style={{ backgroundColor: '#e9204f' }}>
                  Save
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FilterType)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="service">Service</TabsTrigger>
          <TabsTrigger value="procedure">Procedure</TabsTrigger>
          <TabsTrigger value="investigation">Investigation</TabsTrigger>
          <TabsTrigger value="consultation">Consultation</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="cursor-pointer">
          Name
        </Badge>
        <Badge variant="outline" className="cursor-pointer">
          Cost price
        </Badge>
        <Badge variant="outline" className="cursor-pointer">
          Price to patient
        </Badge>
        <Button variant="link" size="sm" onClick={resetFilters}>
          Reset filters
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services by name, type, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Services ({filteredServices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading services...</div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm || activeTab !== 'all' ? 'No services match your criteria.' : 'No services created yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NAME</TableHead>
                    <TableHead>TYPE</TableHead>
                    <TableHead>DESCRIPTION</TableHead>
                    <TableHead>COST</TableHead>
                    <TableHead>PRICE TO PATIENT</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div className="font-medium">{service.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{service.service_type || service.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-48 truncate">
                          {service.description || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-green-600 font-medium">
                          RM {service.cost_price?.toFixed(2) || '0.00'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-green-600 font-medium">
                          {getPriceRange(service)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(service.status)}>
                          {service.status || 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(service)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStatus(service)}>
                              {service.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(service.id)}
                              className="text-destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}