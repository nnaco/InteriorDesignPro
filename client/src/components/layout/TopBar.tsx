import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Plus, Search, Menu } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface TopBarProps {
  title: string;
  onMenuClick?: () => void;
}

export function TopBar({ title, onMenuClick }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden mr-4"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            {notifications.length === 0 ? (
              <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
            ) : (
              notifications.slice(0, 5).map((notification: any) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start space-y-1"
                >
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {notification.message}
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
