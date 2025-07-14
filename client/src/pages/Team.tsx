import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MemberCard } from "@/components/team/MemberCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Users, UserCheck, Briefcase, Building } from "lucide-react";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Team() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Filter team members
  const filteredMembers = users.filter((member: any) => {
    const fullName = `${member.firstName || ""} ${member.lastName || ""}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Calculate stats
  const totalMembers = users.length;
  const activeToday = Math.floor(totalMembers * 0.75); // Mock active status
  const onProjects = Math.floor(totalMembers * 0.6); // Mock project assignment
  const departments = Array.from(new Set(users.map((u: any) => u.role))).length;

  // Get project count for each member (mock calculation)
  const getProjectCount = (userId: string) => {
    return projects.filter((p: any) => p.createdBy === userId).length;
  };

  if (isLoading || !isAuthenticated) {
    return (
      <MainLayout title="Team Directory">
        <div className="space-y-6">
          <Skeleton className="h-12" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Team Directory">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Team Directory</h2>
          <Button>
            <Users className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Total Members"
            value={totalMembers}
            icon={Users}
            iconColor="text-primary"
          />
          <StatsCard
            title="Active Today"
            value={activeToday}
            icon={UserCheck}
            iconColor="text-green-600"
          />
          <StatsCard
            title="On Projects"
            value={onProjects}
            icon={Briefcase}
            iconColor="text-orange-600"
          />
          <StatsCard
            title="Departments"
            value={departments}
            icon={Building}
            iconColor="text-blue-600"
          />
        </div>

        {/* Team Members */}
        <Card className="material-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Team Members</CardTitle>
              <div className="flex space-x-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="manager">Design Manager</SelectItem>
                    <SelectItem value="designer">Interior Designer</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="search"
                    placeholder="Search members..."
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {usersLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40" />
                ))
              ) : filteredMembers.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No team members found</p>
                </div>
              ) : (
                filteredMembers.map((member: any) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    projectCount={getProjectCount(member.id)}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
