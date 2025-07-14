import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen, CheckSquare, Users, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
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

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading || !isAuthenticated) {
    return (
      <MainLayout title="Dashboard">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-96" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Active Projects"
            value={statsLoading ? "..." : stats?.activeProjects || 0}
            icon={FolderOpen}
            trend={{
              value: "8%",
              isPositive: true,
              label: "from last month",
            }}
            iconColor="text-primary"
          />
          <StatsCard
            title="Pending Tasks"
            value={statsLoading ? "..." : stats?.pendingTasks || 0}
            icon={CheckSquare}
            trend={{
              value: "3%",
              isPositive: false,
              label: "from last week",
            }}
            iconColor="text-orange-600"
          />
          <StatsCard
            title="Team Members"
            value={statsLoading ? "..." : stats?.teamMembers || 0}
            icon={Users}
            trend={{
              value: "2",
              isPositive: true,
              label: "new this month",
            }}
            iconColor="text-green-600"
          />
          <StatsCard
            title="Budget Utilization"
            value={statsLoading ? "..." : `${stats?.budgetUtilization || 0}%`}
            icon={TrendingUp}
            trend={{
              value: "On track",
              isPositive: true,
              label: "this quarter",
            }}
            iconColor="text-blue-600"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ActivityFeed />
          </div>
          <div>
            <UpcomingDeadlines />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
