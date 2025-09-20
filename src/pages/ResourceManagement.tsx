import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Monitor, Stethoscope, Plus, Edit, Trash2 } from 'lucide-react';
import { useResources } from '@/hooks/useResources';

export default function ResourceManagement() {
  const { resources, loading, createResource, updateResource, deleteResource } = useResources();
  const [showDialog, setShowDialog] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'room' as 'room' | 'equipment' | 'device',
    description: '',
    capacity: 1,
    location: '',
    status: 'active' as 'active' | 'inactive' | 'maintenance'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'room',
      description: '',
      capacity: 1,
      location: '',
      status: 'active'
    });
    setEditingResource(null);
  };

  const handleSubmit = async () => {
    if (editingResource) {
      await updateResource(editingResource.id, formData);
    } else {
      await createResource(formData);
    }
    setShowDialog(false);
    resetForm();
  };

  const handleEdit = (resource: any) => {
    setEditingResource(resource);
    setFormData({
      name: resource.name,
      type: resource.type,
      description: resource.description || '',
      capacity: resource.capacity,
      location: resource.location || '',
      status: resource.status
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      await deleteResource(id);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'room':
        return <MapPin className="h-5 w-5" />;
      case 'equipment':
        return <Monitor className="h-5 w-5" />;
      case 'device':
        return <Stethoscope className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'maintenance':
        return 'secondary';
      case 'inactive':
        return 'outline';
      default:
        return 'default';
    }
  };

  const groupedResources = resources.reduce((acc, resource) => {
    if (!acc[resource.type]) {
      acc[resource.type] = [];
    }
    acc[resource.type].push(resource);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) {
    return <div className="p-6 text-center">Loading resources...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Resource Management</h1>
          <p className="text-muted-foreground">
            Manage rooms, equipment, and devices for appointment scheduling
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Resource
        </Button>
      </div>

      {Object.keys(groupedResources).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Monitor className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No resources found</h3>
            <p className="text-muted-foreground">
              Add your first resource to start managing room and equipment scheduling.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedResources).map(([type, typeResources]) => (
            <div key={type} className="space-y-4">
              <h2 className="text-xl font-semibold capitalize flex items-center gap-2">
                {getResourceIcon(type)}
                {type}s ({(typeResources as any[]).length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(typeResources as any[]).map((resource) => (
                  <Card key={resource.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {getResourceIcon(resource.type)}
                            {resource.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={getStatusColor(resource.status)}>
                              {resource.status}
                            </Badge>
                            {resource.capacity > 1 && (
                              <Badge variant="outline">
                                Capacity: {resource.capacity}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(resource)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(resource.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {resource.description}
                        </p>
                      )}
                      {resource.location && (
                        <p className="text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {resource.location}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingResource ? 'Edit Resource' : 'Add New Resource'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Operating Room 1, X-Ray Machine"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'room' | 'equipment' | 'device') =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="room">Room</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="device">Device</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., 2nd Floor, East Wing"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'maintenance') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details about this resource"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name}>
              {editingResource ? 'Update' : 'Create'} Resource
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}