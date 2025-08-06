import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { Send, Phone, Video, Paperclip } from 'lucide-react';

interface ChatWindowProps {
  conversationId?: string;
  recipientId?: string;
}

export function ChatWindow({ conversationId, recipientId }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: conversationId ? ['/api/messages', conversationId] : [],
    enabled: !!conversationId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  const recipient = users.find((u: any) => u.id === recipientId);

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected');
      setWs(socket);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_message') {
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setWs(null);
    };

    return () => {
      socket.close();
    };
  }, [user, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !ws || !user || !recipientId) return;

    const messageData = {
      type: 'send_message',
      content: message,
      senderId: user.id,
      recipientId: recipientId,
      conversationId: conversationId || `${user.id}_${recipientId}`,
    };

    ws.send(JSON.stringify(messageData));
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!conversationId || !recipient) {
    return (
      <Card className="material-shadow flex flex-col h-full">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">💬</div>
            <p className="text-muted-foreground">
              Select a conversation to start messaging
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recipientName = `${recipient.firstName || ''} ${
    recipient.lastName || ''
  }`.trim();
  const recipientInitials = `${recipient.firstName?.[0] || ''}${
    recipient.lastName?.[0] || ''
  }`;

  return (
    <Card className="material-shadow flex flex-col h-full">
      <CardHeader className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage
                src={recipient.profileImageUrl}
                alt={recipientName}
              />
              <AvatarFallback>{recipientInitials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{recipientName}</p>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-sm text-green-600">Online</span>
              </div>
            </div>
          </div>
          {/* <div className="flex space-x-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
          </div> */}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg: any) => {
            const isOwn = msg.senderId === user?.id;
            const sender = users.find((u: any) => u.id === msg.senderId);
            const senderName = sender
              ? `${sender.firstName} ${sender.lastName}`
              : 'Unknown';
            const senderInitials = sender
              ? `${sender.firstName?.[0] || ''}${sender.lastName?.[0] || ''}`
              : '?';

            return (
              <div
                key={msg.id}
                className={`flex space-x-3 ${isOwn ? 'justify-end' : ''}`}
              >
                {!isOwn && (
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={sender?.profileImageUrl}
                      alt={senderName}
                    />
                    <AvatarFallback className="text-xs">
                      {senderInitials}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`flex-1 ${isOwn ? 'text-right' : ''}`}>
                  <div
                    className={`inline-block rounded-2xl p-3 max-w-xs lg:max-w-md ${
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-secondary text-foreground rounded-tl-sm'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(msg.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      <div className="p-4 border-t border-border">
        <div className="flex space-x-2">
          {/* <Button variant="ghost" size="sm">
            <Paperclip className="h-4 w-4" />
          </Button> */}
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={!message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
