import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Play, Pause, Square, Clock, Calendar } from 'lucide-react';
import { format, formatDuration, intervalToDuration } from 'date-fns';

interface TimeEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  startTime: string;
  endTime?: string;
  duration: number;
  description?: string;
  isRunning: boolean;
}

interface TimeTrackerProps {
  taskId?: string;
  projectId?: string;
}

export function TimeTracker({ taskId, projectId }: TimeTrackerProps) {
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedTask, setSelectedTask] = useState(taskId || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active time entry
  const { data: activeEntry } = useQuery<TimeEntry>({
    queryKey: ['/api/time-tracking/active'],
    refetchInterval: 1000, // Update every second
  });

  // Fetch tasks for selection
  const { data: tasks = [] } = useQuery({
    queryKey: ['/api/tasks', projectId],
    enabled: !taskId, // Only fetch if taskId not provided
  });

  // Start time tracking
  const startTimer = useMutation({
    mutationFn: async (data: { taskId: string; description?: string }) => {
      return apiRequest('/api/time-tracking/start', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-tracking'] });
      toast({
        title: 'Timer Started',
        description: 'Time tracking has been started for this task.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to start timer. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Stop time tracking
  const stopTimer = useMutation({
    mutationFn: async (entryId: string) => {
      return apiRequest(`/api/time-tracking/${entryId}/stop`, {
        method: 'PUT',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-tracking'] });
      setCurrentEntry(null);
      setElapsedTime(0);
      toast({
        title: 'Timer Stopped',
        description: 'Time entry has been saved successfully.',
      });
    },
  });

  // Update elapsed time for active entry
  useEffect(() => {
    if (activeEntry?.isRunning) {
      setCurrentEntry(activeEntry);
      const startTime = new Date(activeEntry.startTime);
      const updateElapsed = () => {
        const now = new Date();
        const duration = intervalToDuration({ start: startTime, end: now });
        const totalSeconds =
          (duration.hours || 0) * 3600 +
          (duration.minutes || 0) * 60 +
          (duration.seconds || 0);
        setElapsedTime(totalSeconds);
      };

      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    } else {
      setCurrentEntry(null);
      setElapsedTime(0);
    }
  }, [activeEntry]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!selectedTask && !taskId) {
      toast({
        title: 'No Task Selected',
        description: 'Please select a task to track time for.',
        variant: 'destructive',
      });
      return;
    }

    startTimer.mutate({
      taskId: selectedTask || taskId!,
      description: '',
    });
  };

  const handleStop = () => {
    if (currentEntry) {
      stopTimer.mutate(currentEntry.id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Task Selection */}
        {!taskId && tasks.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Task</label>
            <Select value={selectedTask} onValueChange={setSelectedTask}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a task to track time for" />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((task: any) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Timer Display */}
        <div className="text-center space-y-4">
          <div className="text-4xl font-mono font-bold text-primary">
            {formatTime(elapsedTime)}
          </div>

          {currentEntry && (
            <div className="space-y-2">
              <Badge variant="secondary" className="text-sm">
                {currentEntry.taskTitle}
              </Badge>
              <div className="text-sm text-gray-600">
                Started at {format(new Date(currentEntry.startTime), 'HH:mm')}
              </div>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-2">
          {!currentEntry ? (
            <Button
              onClick={handleStart}
              disabled={startTimer.isPending || (!selectedTask && !taskId)}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Timer
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              disabled={stopTimer.isPending}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop Timer
            </Button>
          )}
        </div>

        {/* Recent Time Entries */}
        <TimeEntryList taskId={taskId} projectId={projectId} />
      </CardContent>
    </Card>
  );
}

interface TimeEntryListProps {
  taskId?: string;
  projectId?: string;
}

function TimeEntryList({ taskId, projectId }: TimeEntryListProps) {
  const { data: entries = [] } = useQuery<TimeEntry[]>({
    queryKey: ['/api/time-tracking/entries', { taskId, projectId }],
  });

  if (!entries.length) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        No time entries yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">Recent Entries</h4>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {entries.slice(0, 5).map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
          >
            <div>
              <div className="font-medium">{entry.taskTitle}</div>
              <div className="text-gray-500">
                {format(new Date(entry.startTime), 'MMM d, HH:mm')}
                {entry.endTime &&
                  ` - ${format(new Date(entry.endTime), 'HH:mm')}`}
              </div>
            </div>
            <Badge variant="outline">{formatTime(entry.duration)}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
