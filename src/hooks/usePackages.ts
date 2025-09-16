import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePriceTiers } from './usePriceTiers';
import { useServices } from './useServices';
import { useMedications } from './useMedications';

export interface Package {
  id: string;
  package_name: string;
  package_price: number;
  bundle_value: number;
  discount_percentage?: number;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface PackageItem {
  id: string;
  package_id: string;
  item_id: string;
  item_type: 'service' | 'inventory';
  quantity: number;
  unit_price: number;
  total_price: number;
  stock_at_time_added?: number;
  created_at: string;
}

export interface PackageWithItems extends Package {
  items: (PackageItem & {
    name: string;
    current_stock?: number;
    status?: string;
  })[];
}

export interface AvailableItem {
  id: string;
  name: string;
  type: 'service' | 'inventory';
  price: number;
  current_stock?: number;
  status: string;
}

export function usePackages() {
  const [packages, setPackages] = useState<PackageWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { priceTiers } = usePriceTiers();
  const { services } = useServices();
  const { medications } = useMedications();

  const fetchPackages = async () => {
    try {
      setLoading(true);
      
      // Fetch packages first
      const { data: packagesData, error } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!packagesData) {
        setPackages([]);
        return;
      }

      // Fetch package items separately
      const { data: packageItemsData, error: itemsError } = await supabase
        .from('package_items')
        .select('*')
        .in('package_id', packagesData.map(pkg => pkg.id));

      if (itemsError) throw itemsError;

      // Enrich package items with current data
      const enrichedPackages = await Promise.all(
        packagesData.map(async (pkg) => {
          const packageItems = packageItemsData?.filter(item => item.package_id === pkg.id) || [];
          const enrichedItems = await Promise.all(
            packageItems.map(async (item: any) => {
              let name = '';
              let current_stock = undefined;
              let status = 'active';

              if (item.item_type === 'service') {
                const service = services.find(s => s.id === item.item_id);
                name = service?.name || 'Unknown Service';
                status = service?.status || 'inactive';
              } else if (item.item_type === 'inventory') {
                const medication = medications.find(m => m.id === item.item_id);
                name = medication?.name || 'Unknown Medication';
                current_stock = medication?.stock_level || 0;
                status = 'active'; // Medications don't have status, assume active if exists
              }

              return {
                ...item,
                name,
                current_stock,
                status
              };
            }) || []
          );

          return {
            ...pkg,
            items: enrichedItems
          };
        })
      );

      setPackages(enrichedPackages);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch packages"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvailableItems = (): AvailableItem[] => {
    const availableItems: AvailableItem[] = [];

    // Add active services
    services.forEach(service => {
      if (service.status === 'Active') {
        // Get price from first tier for display (you can modify this logic)
        const price = Object.values(service.pricing)[0] || service.price;
        availableItems.push({
          id: service.id,
          name: service.name,
          type: 'service',
          price: price,
          status: service.status
        });
      }
    });

    // Add in-stock medications
    medications.forEach(medication => {
      if (medication.stock_level > 0) {
        // Get price from first tier for display
        const price = Object.values(medication.pricing)[0] || medication.price_per_unit || 0;
        availableItems.push({
          id: medication.id,
          name: medication.name,
          type: 'inventory',
          price: price,
          current_stock: medication.stock_level,
          status: 'active'
        });
      }
    });

    return availableItems;
  };

  const validatePackageItems = (items: { item_id: string; item_type: string; quantity: number }[]) => {
    const errors: string[] = [];

    items.forEach(item => {
      if (item.item_type === 'inventory') {
        const medication = medications.find(m => m.id === item.item_id);
        if (!medication) {
          errors.push(`Medication not found`);
        } else if (medication.stock_level < item.quantity) {
          errors.push(`Insufficient stock for ${medication.name}. Available: ${medication.stock_level}, Required: ${item.quantity}`);
        }
      } else if (item.item_type === 'service') {
        const service = services.find(s => s.id === item.item_id);
        if (!service || service.status !== 'Active') {
          errors.push(`Service not available or inactive`);
        }
      }
    });

    return errors;
  };

  const createPackage = async (packageData: {
    package_name: string;
    package_price: number;
    items: {
      item_id: string;
      item_type: 'service' | 'inventory';
      quantity: number;
      unit_price: number;
    }[];
  }) => {
    try {
      // Validate items availability
      const validationErrors = validatePackageItems(packageData.items);
      if (validationErrors.length > 0) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: validationErrors.join(', ')
        });
        return false;
      }

      // Calculate bundle value
      const bundle_value = packageData.items.reduce(
        (sum, item) => sum + (item.unit_price * item.quantity), 0
      );

      // Calculate discount percentage
      const discount_percentage = bundle_value > 0 
        ? ((bundle_value - packageData.package_price) / bundle_value) * 100 
        : 0;

      // Create package
      const { data: packageResponse, error: packageError } = await supabase
        .from('packages')
        .insert([{
          package_name: packageData.package_name,
          package_price: packageData.package_price,
          bundle_value: bundle_value,
          discount_percentage: discount_percentage
        }])
        .select()
        .single();

      if (packageError) throw packageError;

      // Create package items
      const packageItems = packageData.items.map(item => {
        const medication = item.item_type === 'inventory' 
          ? medications.find(m => m.id === item.item_id)
          : null;

        return {
          package_id: packageResponse.id,
          item_id: item.item_id,
          item_type: item.item_type,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity,
          stock_at_time_added: medication?.stock_level || null
        };
      });

      const { error: itemsError } = await supabase
        .from('package_items')
        .insert(packageItems);

      if (itemsError) throw itemsError;

      await fetchPackages();
      toast({
        title: "Success",
        description: "Package created successfully"
      });
      return true;
    } catch (error) {
      console.error('Error creating package:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create package"
      });
      return false;
    }
  };

  const updatePackage = async (id: string, packageData: {
    package_name?: string;
    package_price?: number;
    status?: string;
    items?: {
      item_id: string;
      item_type: 'service' | 'inventory';
      quantity: number;
      unit_price: number;
    }[];
  }) => {
    try {
      let updateData: any = {};

      if (packageData.package_name) updateData.package_name = packageData.package_name;
      if (packageData.status) updateData.status = packageData.status;
      
      if (packageData.package_price !== undefined || packageData.items) {
        // If items are provided, validate and recalculate
        if (packageData.items) {
          const validationErrors = validatePackageItems(packageData.items);
          if (validationErrors.length > 0) {
            toast({
              variant: "destructive",
              title: "Validation Error",
              description: validationErrors.join(', ')
            });
            return false;
          }

          const bundle_value = packageData.items.reduce(
            (sum, item) => sum + (item.unit_price * item.quantity), 0
          );
          
          const package_price = packageData.package_price || bundle_value;
          const discount_percentage = bundle_value > 0 
            ? ((bundle_value - package_price) / bundle_value) * 100 
            : 0;

          updateData = {
            ...updateData,
            package_price,
            bundle_value,
            discount_percentage
          };

          // Delete existing items and create new ones
          await supabase
            .from('package_items')
            .delete()
            .eq('package_id', id);

          const packageItems = packageData.items.map(item => {
            const medication = item.item_type === 'inventory' 
              ? medications.find(m => m.id === item.item_id)
              : null;

            return {
              package_id: id,
              item_id: item.item_id,
              item_type: item.item_type,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.unit_price * item.quantity,
              stock_at_time_added: medication?.stock_level || null
            };
          });

          const { error: itemsError } = await supabase
            .from('package_items')
            .insert(packageItems);

          if (itemsError) throw itemsError;
        }
      }

      // Update package
      const { error: packageError } = await supabase
        .from('packages')
        .update(updateData)
        .eq('id', id);

      if (packageError) throw packageError;

      await fetchPackages();
      toast({
        title: "Success",
        description: "Package updated successfully"
      });
      return true;
    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update package"
      });
      return false;
    }
  };

  const deletePackage = async (id: string) => {
    try {
      // Delete package items first
      await supabase
        .from('package_items')
        .delete()
        .eq('package_id', id);

      // Delete package
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPackages(prev => prev.filter(pkg => pkg.id !== id));
      toast({
        title: "Success",
        description: "Package deleted successfully"
      });
      return true;
    } catch (error) {
      console.error('Error deleting package:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete package"
      });
      return false;
    }
  };

  useEffect(() => {
    if (services.length > 0 || medications.length > 0) {
      fetchPackages();
    }
  }, [services, medications]);

  return {
    packages,
    loading,
    availableItems: getAvailableItems(),
    createPackage,
    updatePackage,
    deletePackage,
    refetch: fetchPackages,
    validatePackageItems
  };
}