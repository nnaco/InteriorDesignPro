import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChatList } from '@/components/messages/ChatList';
import { ChatWindow } from '@/components/messages/ChatWindow';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { isUnauthorizedError } from '@/lib/authUtils';
import { useQuery } from '@tanstack/react-query';
import { User } from '@shared/schema';

export default function Messages() {
  const [selectedConversationId, setSelectedConversationId] =
    useState<string>();
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

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
  }, [isAuthenticated, isLoading, toast]);

  const handleConversationSelect = (
    conversationId: string,
    recipientId: string
  ) => {
    setSelectedConversationId(conversationId);
    setSelectedRecipientId(recipientId);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <MainLayout title="Messages">
        <div>Loading...</div>
      </MainLayout>
    );
  }

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  return (
    <MainLayout title="Messages">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Messages</h2>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                // form.reset();
              }
              setIsDialogOpen(isOpen);
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Message User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {usersLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : (
                  users.map((user) => (
                    <Button
                      key={user.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        handleConversationSelect('', user.id);
                        setIsDialogOpen(false);
                      }}
                    >
                      {user.firstName} {user.lastName}
                    </Button>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Messages Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Chat List */}
          <div className="lg:col-span-1">
            <ChatList
              onConversationSelect={handleConversationSelect}
              selectedConversationId={selectedConversationId}
            />
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2">
            <ChatWindow
              conversationId={
                selectedConversationId ||
                (selectedRecipientId &&
                  user &&
                  `${user.id}_${selectedRecipientId}`)
              }
              recipientId={selectedRecipientId}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
