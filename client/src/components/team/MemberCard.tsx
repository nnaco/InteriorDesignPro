import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Briefcase } from "lucide-react";

interface MemberCardProps {
  member: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role: string;
    profileImageUrl?: string;
  };
  projectCount?: number;
}

export function MemberCard({ member, projectCount = 0 }: MemberCardProps) {
  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`;
  };

  const getDisplayName = (firstName?: string, lastName?: string) => {
    return `${firstName || ""} ${lastName || ""}`.trim() || "Unknown User";
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "manager":
        return "Design Manager";
      case "designer":
        return "Interior Designer";
      case "contractor":
        return "Contractor";
      case "client":
        return "Client";
      case "admin":
        return "Administrator";
      default:
        return "Team Member";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "manager":
        return "bg-purple-100 text-purple-800";
      case "designer":
        return "bg-blue-100 text-blue-800";
      case "contractor":
        return "bg-orange-100 text-orange-800";
      case "client":
        return "bg-green-100 text-green-800";
      case "admin":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isOnline = Math.random() > 0.3; // Mock online status

  return (
    <Card className="border border-border hover:shadow-material transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="relative">
            <Avatar className="w-12 h-12">
              <AvatarImage src={member.profileImageUrl} alt={getDisplayName(member.firstName, member.lastName)} />
              <AvatarFallback>{getInitials(member.firstName, member.lastName)}</AvatarFallback>
            </Avatar>
            <div
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                isOnline ? "bg-green-400" : "bg-gray-400"
              }`}
              title={isOnline ? "Online" : "Offline"}
            />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground">
              {getDisplayName(member.firstName, member.lastName)}
            </h4>
            <Badge className={`text-xs ${getRoleColor(member.role)}`}>
              {getRoleDisplay(member.role)}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          {member.email && (
            <div className="flex items-center text-muted-foreground">
              <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{member.email}</span>
            </div>
          )}
          <div className="flex items-center text-muted-foreground">
            <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>(555) {Math.floor(Math.random() * 900) + 100}-{Math.floor(Math.random() * 9000) + 1000}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Briefcase className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{projectCount} Active Projects</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
