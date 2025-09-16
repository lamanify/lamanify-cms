import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Upload } from 'lucide-react';
import { useHeaderSettings, HeaderSettings } from '@/hooks/useHeaderSettings';

interface HeaderSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HeaderSettingsModal({ open, onOpenChange }: HeaderSettingsModalProps) {
  const { headerSettings, updateHeaderSettings } = useHeaderSettings();
  const [formData, setFormData] = useState({
    clinic_name: '',
    logo_url: '',
    address: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (headerSettings) {
      setFormData({
        clinic_name: headerSettings.clinic_name || '',
        logo_url: headerSettings.logo_url || '',
        address: headerSettings.address || '',
        phone: headerSettings.phone || '',
        email: headerSettings.email || ''
      });
    }
  }, [headerSettings]);

  const handleSave = async () => {
    const success = await updateHeaderSettings(formData);
    if (success) {
      onOpenChange(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, we'll just store the file name
      // In a real implementation, you'd upload to storage and get the URL
      setFormData(prev => ({ ...prev, logo_url: file.name }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Header Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Logo Upload */}
          <div>
            <Label htmlFor="logo">Clinic Logo</Label>
            <div className="mt-2 flex items-center gap-4">
              <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                {formData.logo_url ? (
                  <img 
                    src={formData.logo_url} 
                    alt="Logo preview" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Upload className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div>
                <input
                  type="file"
                  id="logo"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('logo')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {formData.logo_url ? 'Change Logo' : 'Upload Logo'}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: 200x200px, PNG or JPG
                </p>
              </div>
            </div>
          </div>

          {/* Clinic Name */}
          <div>
            <Label htmlFor="clinic_name">Clinic Name *</Label>
            <Input
              id="clinic_name"
              value={formData.clinic_name}
              onChange={(e) => setFormData(prev => ({ ...prev, clinic_name: e.target.value }))}
              placeholder="Enter clinic name"
            />
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address">Full Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter full clinic address"
              rows={3}
            />
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">Telephone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="e.g., +60 12-345 6789"
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="e.g., info@yourclinic.com"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}