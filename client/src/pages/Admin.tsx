import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { UserPlus, Search, MoreHorizontal, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const userFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['admin', 'manager', 'designer', 'contractor', 'client']),
});

type UserFormData = z.infer<typeof userFormSchema>;

export default function Admin() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: 'Unauthorized',
        description: 'You are logged out. Logging in again...',
        variant: 'destructive',
      });
      setTimeout(() => {
        window.location.href = '/api/login';
      }, 500);
      return;
    }
    // Check if user has admin/manager permissions
    if (
      !isLoading &&
      isAuthenticated &&
      user?.role !== 'admin' &&
      user?.role !== 'manager'
    ) {
      toast({
        title: 'Access Denied',
        description: "You don't have permission to access this page",
        variant: 'destructive',
      });
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: 'Unauthorized',
          description: 'You are logged out. Logging in again...',
          variant: 'destructive',
        });
        setTimeout(() => {
          window.location.href = '/api/login';
        }, 500);
        return;
      }
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiRequest('PUT', `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: 'Unauthorized',
          description: 'You are logged out. Logging in again...',
          variant: 'destructive',
        });
        setTimeout(() => {
          window.location.href = '/api/login';
        }, 500);
        return;
      }
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    },
  });

  // Filter users
  const filteredUsers = users.filter((u: any) => {
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-purple-100 text-purple-800';
      case 'designer':
        return 'bg-blue-100 text-blue-800';
      case 'contractor':
        return 'bg-orange-100 text-orange-800';
      case 'client':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'manager':
        return 'Design Manager';
      case 'designer':
        return 'Interior Designer';
      case 'contractor':
        return 'Contractor';
      case 'client':
        return 'Client';
      default:
        return 'Team Member';
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
  };

  const getDisplayName = (firstName?: string, lastName?: string) => {
    return `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown User';
  };

  if (isLoading || !isAuthenticated || usersLoading) {
    return (
      <MainLayout title="Admin Panel">
        <div>Loading...</div>
      </MainLayout>
    );
  }

  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <MainLayout title="Admin Panel">
        <div className="text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Access Denied
          </h3>
          <p className="text-muted-foreground">
            You don't have permission to access this page
          </p>
        </div>
      </MainLayout>
    );
  }

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      await apiRequest('POST', '/api/users', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: 'Unauthorized',
          description: 'You are logged out. Logging in again...',
          variant: 'destructive',
        });
        setTimeout(() => {
          window.location.href = '/api/login';
        }, 500);
        return;
      }
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to create user',
        variant: 'destructive',
      });
    },
  });

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: 'client',
    },
  });

  const onSubmit = (data: UserFormData) => {
    createUserMutation.mutate(data);
  };

  return (
    <MainLayout title="Admin Panel">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            User Management
          </h2>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                form.reset();
              }
              setIsCreateDialogOpen(isOpen);
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter email"
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="contractor">
                              Contractor
                            </SelectItem>
                            <SelectItem value="designer">Designer</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending
                        ? 'Creating...'
                        : 'Create User'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* User Management */}
        <Card className="material-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Users</CardTitle>
              <div className="flex space-x-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Design Manager</SelectItem>
                    <SelectItem value="designer">Interior Designer</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="search"
                    placeholder="Search users..."
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">No users found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage
                              src={u.profileImageUrl}
                              alt={getDisplayName(u.firstName, u.lastName)}
                            />
                            <AvatarFallback className="text-xs">
                              {getInitials(u.firstName, u.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {getDisplayName(u.firstName, u.lastName)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(u.role)}>
                          {getRoleDisplay(u.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.createdAt
                          ? format(new Date(u.createdAt), 'MMM d, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                updateRoleMutation.mutate({
                                  userId: u.id,
                                  role: 'admin',
                                })
                              }
                              disabled={u.role === 'admin'}
                            >
                              Make Administrator
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateRoleMutation.mutate({
                                  userId: u.id,
                                  role: 'manager',
                                })
                              }
                              disabled={u.role === 'manager'}
                            >
                              Make Manager
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateRoleMutation.mutate({
                                  userId: u.id,
                                  role: 'designer',
                                })
                              }
                              disabled={u.role === 'designer'}
                            >
                              Make Designer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateRoleMutation.mutate({
                                  userId: u.id,
                                  role: 'contractor',
                                })
                              }
                              disabled={u.role === 'contractor'}
                            >
                              Make Contractor
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateRoleMutation.mutate({
                                  userId: u.id,
                                  role: 'client',
                                })
                              }
                              disabled={u.role === 'client'}
                            >
                              Make Client
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
      </div>
    </MainLayout>
  );
}
