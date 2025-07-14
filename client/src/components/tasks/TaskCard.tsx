import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { format, isValid } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    priority: string;
    projectId?: string;
    assigneeId?: string;
    dueDate?: string;
    status: string;
  };
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const project = projects.find((p: any) => p.id === task.projectId);
  const assignee = users.find((u: any) => u.id === task.assigneeId);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "priority-high";
      case "medium":
        return "priority-medium";
      case "low":
        return "priority-low";
      default:
        return "priority-medium";
    }
  };

  const getAssigneeInitials = (user: any) => {
    if (!user) return "?";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`;
  };

  const getAssigneeName = (user: any) => {
    if (!user) return "Unassigned";
    return `${user.firstName || ""} ${user.lastName || ""}`.trim();
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (!isValid(date)) return null;
    return format(date, "MMM d");
  };

  const statuses = [
    { value: "todo", label: "To Do" },
    { value: "in_progress", label: "In Progress" },
    { value: "review", label: "Review" },
    { value: "done", label: "Done" },
  ];

  return (
    <Card className="kanban-card bg-white border border-border rounded-lg cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-medium text-foreground line-clamp-2">
            {task.title}
          </h4>
          <div className="flex items-center space-x-2">
            <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {statuses.map((status) => (
                  <DropdownMenuItem
                    key={status.value}
                    onClick={() => onStatusChange?.(task.id, status.value)}
                  >
                    Move to {status.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {project && (
          <p className="text-xs text-muted-foreground mb-3">{project.name}</p>
        )}

        {task.status === "in_progress" && (
          <div className="w-full bg-secondary rounded-full h-2 mb-3">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: "75%" }}></div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {assignee && (
              <Avatar className="w-6 h-6 border-2 border-white">
                <AvatarImage src={assignee.profileImageUrl} alt={getAssigneeName(assignee)} />
                <AvatarFallback className="text-xs">{getAssigneeInitials(assignee)}</AvatarFallback>
              </Avatar>
            )}
          </div>
          {task.dueDate && (
            <span className="text-xs text-muted-foreground">
              {formatDueDate(task.dueDate)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
