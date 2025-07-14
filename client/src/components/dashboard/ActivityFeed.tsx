import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export function ActivityFeed() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["/api/activities"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const getUserById = (id: string) => {
    return users.find((user: any) => user.id === id);
  };

  if (isLoading) {
    return (
      <Card className="material-shadow">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="material-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Activity</CardTitle>
        <Button variant="ghost" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No recent activity
            </p>
          ) : (
            activities.map((activity: any) => {
              const user = getUserById(activity.userId);
              const userName = user ? `${user.firstName} ${user.lastName}` : "Unknown User";
              const userInitials = user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}` : "?";
              
              return (
                <div key={activity.id} className="flex items-start space-x-4 p-4 hover:bg-secondary rounded-lg">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user?.profileImageUrl} alt={userName} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{userName}</span> {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
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
