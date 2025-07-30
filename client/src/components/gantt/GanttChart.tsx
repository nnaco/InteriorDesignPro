import { useQuery } from '@tanstack/react-query';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users } from 'lucide-react';

interface GanttTask {
  id: string;
  title: string;
  startDate: string;
  dueDate: string;
  status: string;
  priority: string;
  assignedTo?: string;
  progress: number;
  dependencies?: string[];
}

interface GanttChartProps {
  projectId?: string;
}

export function GanttChart({ projectId }: GanttChartProps) {
  const { data: tasks = [], isLoading } = useQuery<GanttTask[]>({
    queryKey: ['/api/tasks', projectId],
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Project Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tasks.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Project Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No tasks available for timeline view
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate timeline bounds
  const allDates = tasks.flatMap((task) => [
    parseISO(task.startDate),
    parseISO(task.dueDate),
  ]);
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
  const totalDays = differenceInDays(maxDate, minDate) + 1;

  // Generate timeline headers
  const timelineHeaders = [];
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(minDate, i);
    timelineHeaders.push({
      date,
      dayOfMonth: format(date, 'd'),
      month: format(date, 'MMM'),
      isFirstOfMonth: date.getDate() === 1,
    });
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'review':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500';
      case 'medium':
        return 'border-yellow-500';
      case 'low':
        return 'border-green-500';
      default:
        return 'border-gray-300';
    }
  };

  const calculateTaskPosition = (task: GanttTask) => {
    const startDate = parseISO(task.startDate);
    const endDate = parseISO(task.dueDate);
    const startOffset = differenceInDays(startDate, minDate);
    const duration = differenceInDays(endDate, startDate) + 1;

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
    };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Project Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {/* Timeline Header */}
          <div className="mb-4 border-b">
            <div className="flex text-xs text-gray-600 h-8 items-end">
              <div className="w-48 flex-shrink-0"></div>
              <div className="flex-1 relative">
                {timelineHeaders.map((header, index) => (
                  <div
                    key={index}
                    className={`absolute top-0 border-l border-gray-200 px-1 ${
                      header.isFirstOfMonth ? 'font-medium' : ''
                    }`}
                    style={{ left: `${(index / totalDays) * 100}%` }}
                  >
                    {header.isFirstOfMonth && (
                      <div className="font-medium">{header.month}</div>
                    )}
                    <div className="text-gray-400">{header.dayOfMonth}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Task Rows */}
          <div className="space-y-2">
            {tasks.map((task) => {
              const position = calculateTaskPosition(task);
              return (
                <div key={task.id} className="flex items-center h-12">
                  {/* Task Info */}
                  <div className="w-48 flex-shrink-0 pr-4">
                    <div className="text-sm font-medium truncate">
                      {task.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority}
                      </Badge>
                      {task.assignedTo && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {task.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timeline Bar */}
                  <div className="flex-1 relative h-6">
                    <div
                      className={`absolute h-6 rounded ${getStatusColor(
                        task.status
                      )} opacity-80 flex items-center px-2`}
                      style={position}
                    >
                      {/* Progress overlay */}
                      <div
                        className="absolute left-0 top-0 h-full bg-white bg-opacity-30 rounded"
                        style={{ width: `${task.progress}%` }}
                      ></div>

                      <span className="text-white text-xs font-medium truncate relative z-10">
                        {task.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-300 rounded"></div>
                  <span>To Do</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>Review</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Done</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
