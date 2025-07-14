import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Search } from "lucide-react";
import { useState } from "react";

interface ChatListProps {
  onConversationSelect: (conversationId: string, recipientId: string) => void;
  selectedConversationId?: string;
}

export function ChatList({ onConversationSelect, selectedConversationId }: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/conversations"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const getUserById = (id: string) => {
    return users.find((user: any) => user.id === id);
  };

  const filteredConversations = conversations.filter((conv: any) => {
    if (!searchQuery) return true;
    const otherUser = getUserById(conv.otherUserId);
    const userName = otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : "";
    return userName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Card className="material-shadow h-full">
      <CardContent className="p-0">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="search"
              placeholder="Search conversations..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-96">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No conversations found
            </div>
          ) : (
            filteredConversations.map((conversation: any) => {
              const otherUser = getUserById(conversation.otherUserId);
              const userName = otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : "Unknown User";
              const userInitials = otherUser ? `${otherUser.firstName?.[0] || ""}${otherUser.lastName?.[0] || ""}` : "?";
              const isSelected = selectedConversationId === conversation.conversationId;
              
              return (
                <div
                  key={conversation.conversationId || conversation.otherUserId}
                  className={`p-4 border-b border-border hover:bg-secondary cursor-pointer transition-colors ${
                    isSelected ? "bg-primary/5" : ""
                  }`}
                  onClick={() => onConversationSelect(
                    conversation.conversationId || conversation.otherUserId,
                    conversation.otherUserId
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={otherUser?.profileImageUrl} alt={userName} />
                        <AvatarFallback>{userInitials}</AvatarFallback>
                      </Avatar>
                      {Math.random() > 0.5 && ( // Mock online status
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground truncate">{userName}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>
                    {!conversation.isRead && (
                      <Badge variant="default" className="w-2 h-2 p-0 rounded-full" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
