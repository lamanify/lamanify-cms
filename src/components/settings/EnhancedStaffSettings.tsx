import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Users,
  UserCheck,
  Shield,
  Key,
  AlertTriangle
} from 'lucide-react';
import { useUserManagement, type UserRole, type CreateUserData, type UpdateUserData, roleDescriptions, dashboardAccess, defaultPermissions } from '@/hooks/useUserManagement';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'doctor', label: 'Doctor & clinical staff' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'receptionist', label: 'Clinic assistant' },
  { value: 'locum', label: 'Locum' }
];

const permissionOptions = [
  { key: 'view_clinic_management', label: 'Do not allow viewing clinic management', negative: true },
  { key: 'view_sales_report', label: 'Do not allow viewing sales report', negative: true },
  { key: 'manage_users', label: 'Allow manage users', negative: false },
  { key: 'cancel_visit', label: 'Allow cancel visit (Registration)', negative: false }
];

export function EnhancedStaffSettings() {
  const { users, loading, createUser, updateUser, deleteUser, resetPassword, getUserPermissions } = useUserManagement();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form handling
  const createForm = useForm<CreateUserData>({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      role: 'receptionist',
      permissions: {}
    }
  });

  const editForm = useForm<UpdateUserData>({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'receptionist',
      permissions: {}
    }
  });

  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [users, roleFilter, searchTerm]);

  const resetForms = () => {
    createForm.reset();
    editForm.reset();
    setEditingUser(null);
  };

  const openCreateModal = () => {
    resetForms();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    const userPermissions = getUserPermissions(user);
    
    editForm.reset({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      permissions: userPermissions
    });
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (data: CreateUserData) => {
    const success = await createUser(data);
    if (success) {
      setIsCreateModalOpen(false);
      resetForms();
    }
  };

  const handleEditSubmit = async (data: UpdateUserData) => {
    if (!editingUser) return;
    
    const success = await updateUser(editingUser.id, data);
    if (success) {
      setIsEditModalOpen(false);
      resetForms();
    }
  };

  const handleDelete = async (userId: string) => {
    if (confirm('Are you sure you want to deactivate this user?')) {
      await deleteUser(userId);
    }
  };

  const handleResetPassword = async (email: string) => {
    await resetPassword(email);
  };

  const getRolePermissions = (role: UserRole) => {
    const permissions: { [key: string]: boolean } = {};
    Object.keys(defaultPermissions).forEach(permission => {
      permissions[permission] = defaultPermissions[permission as keyof typeof defaultPermissions][role];
    });
    return permissions;
  };

  const updateFormPermissions = (role: UserRole, form: any) => {
    const rolePermissions = getRolePermissions(role);
    form.setValue('permissions', rolePermissions);
  };

  const renderCreateModal = () => {
    const selectedRole = createForm.watch('role');
    const permissions = createForm.watch('permissions') || {};

    return (
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle>Add User</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-6">
          {/* User Details Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create_first_name">First Name *</Label>
                  <Input
                    id="create_first_name"
                    {...createForm.register('first_name', { required: 'First name is required' })}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="create_last_name">Last Name *</Label>
                  <Input
                    id="create_last_name"
                    {...createForm.register('last_name', { required: 'Last name is required' })}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="create_email">Email Address *</Label>
                <Input
                  id="create_email"
                  type="email"
                  {...createForm.register('email', { required: 'Email is required' })}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <Label htmlFor="create_phone">Phone Number</Label>
                <Input
                  id="create_phone"
                  {...createForm.register('phone')}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <Label htmlFor="create_password">Password *</Label>
                <Input
                  id="create_password"
                  type="password"
                  {...createForm.register('password', { required: 'Password is required', minLength: 6 })}
                  placeholder="Enter password (min 6 characters)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Role Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Role Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>User Role</Label>
                <Select 
                  value={selectedRole} 
                  onValueChange={(value: UserRole) => {
                    createForm.setValue('role', value);
                    updateFormPermissions(value, createForm);
                  }}
                >
                  <SelectTrigger className="bg-background border shadow-sm">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRole && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Role Description:</strong> {roleDescriptions[selectedRole]}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Dashboard Access:</strong> {dashboardAccess[selectedRole].join(', ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permission Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Permission Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {permissionOptions.map((permission) => (
                <div key={permission.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`create_${permission.key}`}
                    checked={permission.negative ? !permissions[permission.key] : permissions[permission.key]}
                    onCheckedChange={(checked) => {
                      const value = permission.negative ? !checked : checked;
                      createForm.setValue(`permissions.${permission.key}` as any, value);
                    }}
                  />
                  <Label htmlFor={`create_${permission.key}`} className="text-sm">
                    {permission.label}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-[#e9204f] hover:bg-[#d91d47] text-white">
              Create User
            </Button>
          </div>
        </form>
      </DialogContent>
    );
  };

  const renderEditModal = () => {
    const selectedRole = editForm.watch('role');
    const permissions = editForm.watch('permissions') || {};

    return (
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle>Edit User</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-6">
          {/* User Details Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_first_name">First Name *</Label>
                  <Input
                    id="edit_first_name"
                    {...editForm.register('first_name', { required: 'First name is required' })}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_last_name">Last Name *</Label>
                  <Input
                    id="edit_last_name"
                    {...editForm.register('last_name', { required: 'Last name is required' })}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_email">Email Address *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  {...editForm.register('email', { required: 'Email is required' })}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <Label htmlFor="edit_phone">Phone Number</Label>
                <Input
                  id="edit_phone"
                  {...editForm.register('phone')}
                  placeholder="Enter phone number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Role Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Role Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>User Role</Label>
                <Select 
                  value={selectedRole} 
                  onValueChange={(value: UserRole) => {
                    editForm.setValue('role', value);
                    updateFormPermissions(value, editForm);
                  }}
                >
                  <SelectTrigger className="bg-background border shadow-sm">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRole && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Role Description:</strong> {roleDescriptions[selectedRole]}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Dashboard Access:</strong> {dashboardAccess[selectedRole].join(', ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permission Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Permission Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {permissionOptions.map((permission) => (
                <div key={permission.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit_${permission.key}`}
                    checked={permission.negative ? !permissions[permission.key] : permissions[permission.key]}
                    onCheckedChange={(checked) => {
                      const value = permission.negative ? !checked : checked;
                      editForm.setValue(`permissions.${permission.key}` as any, value);
                    }}
                  />
                  <Label htmlFor={`edit_${permission.key}`} className="text-sm">
                    {permission.label}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-[#e9204f] hover:bg-[#d91d47] text-white">
              Update User
            </Button>
          </div>
        </form>
      </DialogContent>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6" />
              Staff & User Management
            </h2>
            <p className="text-muted-foreground">Manage clinic staff and user permissions</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" />
            Staff & User Management
          </h2>
          <p className="text-muted-foreground">Manage clinic staff and user permissions</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateModal} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          {renderCreateModal()}
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[200px] bg-background border shadow-sm">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            <SelectItem value="all">All Roles</SelectItem>
            {roleOptions.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NAME</TableHead>
                <TableHead>EMAIL</TableHead>
                <TableHead>ROLE</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>LAST LOGIN</TableHead>
                <TableHead>ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm || roleFilter !== 'all' ? 'No users found matching your filters.' : 'No users created yet.'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {roleOptions.find(r => r.value === user.role)?.label || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.last_login_at 
                        ? new Date(user.last_login_at).toLocaleDateString()
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border shadow-md">
                          <DropdownMenuItem onClick={() => openEditModal(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(user.email)}>
                            <Key className="h-4 w-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          {user.role !== 'admin' && (
                            <DropdownMenuItem 
                              onClick={() => handleDelete(user.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          )}
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
        {renderEditModal()}
      </Dialog>

      {/* Security Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-amber-800">
                User Management Security
              </h4>
              <p className="text-sm text-amber-700">
                Changes to user roles and permissions take effect immediately. Users may need to refresh their session for permission changes to apply. Admin users cannot be deactivated through this interface.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}