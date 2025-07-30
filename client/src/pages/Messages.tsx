import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChatList } from '@/components/messages/ChatList';
import { ChatWindow } from '@/components/messages/ChatWindow';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

export default function Messages() {
  const [selectedConversationId, setSelectedConversationId] =
    useState<string>();
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>();

  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  return (
    <MainLayout title="Messages">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Messages</h2>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
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
              conversationId={selectedConversationId}
              recipientId={selectedRecipientId}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
