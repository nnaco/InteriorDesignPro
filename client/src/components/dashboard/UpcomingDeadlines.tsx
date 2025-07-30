import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';
import { Calendar } from 'lucide-react';

export function UpcomingDeadlines() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });

  const getProjectName = (projectId: string) => {
    const project = projects.find((p: any) => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const getDeadlineStatus = (dueDate: string) => {
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date))
      return { label: 'Overdue', color: 'border-red-400 text-red-600' };
    if (isToday(date))
      return { label: 'Due Today', color: 'border-red-400 text-red-600' };
    if (isTomorrow(date))
      return {
        label: 'Due Tomorrow',
        color: 'border-orange-400 text-orange-600',
      };
    return {
      label: `Due ${formatDistanceToNow(date, { addSuffix: true })}`,
      color: 'border-blue-400 text-blue-600',
    };
  };

  const upcomingTasks = tasks
    .filter((task: any) => task.dueDate && task.status !== 'done')
    .sort(
      (a: any, b: any) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )
    .slice(0, 5);

  return (
    <Card className="material-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Upcoming Deadlines</CardTitle>
        <Button variant="ghost" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          View Calendar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingTasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No upcoming deadlines
            </p>
          ) : (
            upcomingTasks.map((task: any) => {
              const deadline = getDeadlineStatus(task.dueDate);

              return (
                <div
                  key={task.id}
                  className={`border-l-4 pl-4 py-2 ${
                    deadline.color.split(' ')[0]
                  }`}
                >
                  <p className="font-medium text-foreground text-sm">
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getProjectName(task.projectId)}
                  </p>
                  <p
                    className={`text-xs mt-1 ${deadline.color
                      .split(' ')
                      .slice(1)
                      .join(' ')}`}
                  >
                    {deadline.label}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
