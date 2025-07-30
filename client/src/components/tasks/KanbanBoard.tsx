import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskCard } from './TaskCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const columns = [
  { id: 'todo', title: 'To Do', color: 'bg-secondary-200' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'review', title: 'Review', color: 'bg-orange-100' },
  { id: 'done', title: 'Done', color: 'bg-green-100' },
];

interface KanbanBoardProps {
  projectId?: string;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: projectId ? ['/api/tasks', { projectId }] : ['/api/tasks'],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: any }) => {
      await apiRequest('PUT', `/api/tasks/${taskId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });
    },
    onError: (error) => {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    },
  });

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task: any) => task.status === status);
  };

  const handleTaskStatusChange = (taskId: string, newStatus: string) => {
    updateTaskMutation.mutate({
      taskId,
      data: { status: newStatus },
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.id);

        return (
          <Card key={column.id} className="material-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{column.title}</CardTitle>
                <Badge variant="secondary" className={column.color}>
                  {columnTasks.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {columnTasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 text-sm">
                    No tasks
                  </p>
                ) : (
                  columnTasks.map((task: any) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={handleTaskStatusChange}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
