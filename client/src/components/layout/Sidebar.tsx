import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Home,
  FolderOpen,
  CheckSquare,
  Users,
  FileText,
  Calendar,
  MessageSquare,
  Settings,
  UserCog,
  Box,
  BarChart3,
  UserCheck,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, isPublic: false },
  { name: 'Projects', href: '/projects', icon: FolderOpen, isPublic: false },
  {
    name: 'Project Management',
    href: '/project-management',
    icon: BarChart3,
    isPublic: false,
  },
  {
    name: 'Client Portal',
    href: '/client-portal',
    icon: UserCheck,
    isPublic: true,
  },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, isPublic: false },
  { name: 'Team', href: '/team', icon: Users, isPublic: false },
  { name: 'Documents', href: '/documents', icon: FileText, isPublic: false },
  { name: 'Calendar', href: '/calendar', icon: Calendar, isPublic: false },
  { name: 'Messages', href: '/messages', icon: MessageSquare, isPublic: false },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email || 'User';

  const roleDisplay =
    user?.role === 'manager'
      ? 'Design Manager'
      : user?.role === 'designer'
      ? 'Interior Designer'
      : user?.role === 'contractor'
      ? 'Contractor'
      : user?.role === 'client'
      ? 'Client'
      : user?.role === 'admin'
      ? 'Administrator'
      : 'Team Member';

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-white border-r border-border',
        className
      )}
    >
      <div className="p-6">
        <div className="flex items-center mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-3">
            <Box className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">DesignFlow</span>
        </div>

        <nav className="space-y-2">
          {navigation
            .filter((item) => {
              if (user?.role === 'client' && item.isPublic) {
                return true; // Show public items for clients
              }
              if (
                (user?.role === 'admin' ||
                  user?.role === 'manager' ||
                  user?.role === 'designer') &&
                !item.isPublic
              ) {
                return true; // Admins, managers, and designers see all items
              }
              return false;
            })
            .map((item) => {
              const isActive =
                location === item.href ||
                (item.href !== '/' && location.startsWith(item.href));

              return (
                <Link key={item.name} href={item.href}>
                  <span
                    onClick={onNavigate}
                    className={cn(
                      'nav-item flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors',
                      isActive
                        ? 'active text-primary bg-primary-50'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </span>
                </Link>
              );
            })}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <div className="border-t border-border pt-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profileImageUrl} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {roleDisplay}
              </p>
            </div>
            <div className="flex space-x-1">
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <UserCog className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
