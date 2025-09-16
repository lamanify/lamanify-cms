import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Settings,
  FileText,
  Image
} from 'lucide-react';
import { useDocumentTemplates } from '@/hooks/useDocumentTemplates';
import { useHeaderSettings } from '@/hooks/useHeaderSettings';
import { TemplateEditor } from './TemplateEditor';
import { HeaderSettingsModal } from './HeaderSettingsModal';

const templateTypes = [
  'All',
  'Medical certificate',
  'Prescription letter', 
  'Medical records',
  'Billings',
  'Medical document'
];

export function DocumentTemplatesPage() {
  const { templates, loading, deleteTemplate, toggleTemplateStatus } = useDocumentTemplates();
  const { headerSettings } = useHeaderSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showHeaderModal, setShowHeaderModal] = useState(false);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || template.template_type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setShowEditor(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(id);
    }
  };

  const formatPriceRange = (priceFrom?: number, priceTo?: number) => {
    if (!priceFrom && !priceTo) return 'Free';
    if (priceFrom === priceTo) return `RM ${priceFrom?.toFixed(2)}`;
    return `RM ${priceFrom?.toFixed(2)} - RM ${priceTo?.toFixed(2)}`;
  };

  if (showEditor) {
    return (
      <TemplateEditor
        template={editingTemplate}
        onClose={() => {
          setShowEditor(false);
          setEditingTemplate(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Header
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Setup your header with logo, clinic name, address and telephone number.
              </p>
            </div>
            <Button onClick={() => setShowHeaderModal(true)}>
              Edit header now
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Image className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium">{headerSettings?.clinic_name || 'Your Clinic Name'}</h3>
              <p className="text-sm text-muted-foreground">
                {headerSettings?.address || 'Your Clinic Address'}
              </p>
              <p className="text-sm text-muted-foreground">
                {headerSettings?.phone || '+60 12-345 6789'} • {headerSettings?.email || 'info@yourclinic.com'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Templates
            </CardTitle>
            <Button onClick={handleAddTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Add template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedType} onValueChange={setSelectedType} className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              {templateTypes.map((type) => (
                <TabsTrigger key={type} value={type} className="text-xs">
                  {type}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Name" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Names</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setSelectedType('All');
              }}>
                Reset filters
              </Button>
            </div>

            <TabsContent value={selectedType} className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NAME</TableHead>
                    <TableHead>DESCRIPTION</TableHead>
                    <TableHead>CATEGORY</TableHead>
                    <TableHead>PRICE TO PATIENT</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead className="text-right">ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading templates...
                      </TableCell>
                    </TableRow>
                  ) : filteredTemplates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No templates found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">
                          {template.template_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {template.description || 'No description'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {template.template_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatPriceRange(template.price_from, template.price_to)}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={template.status === 'active'}
                            onCheckedChange={() => toggleTemplateStatus(template.id, template.status)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit template
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete template
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <HeaderSettingsModal
        open={showHeaderModal}
        onOpenChange={setShowHeaderModal}
      />
    </div>
  );
}