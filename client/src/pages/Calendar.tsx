import { useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function Calendar() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: 'Unauthorized',
        description: 'You are logged out. Logging in again...',
        variant: 'destructive',
      });
      setTimeout(() => {
        window.location.href = '/api/login';
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <MainLayout title="Calendar">
        <div>Loading...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Calendar">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Calendar</h2>
          <div className="flex space-x-2">
            <Button variant="outline">Today</Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          </div>
        </div>

        {/* Calendar Component */}
        <Card className="material-shadow">
          <CardContent className="p-6">
            <div className="text-center py-20">
              <CalendarIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Calendar Component
              </h3>
              <p className="text-muted-foreground mb-4">
                Full calendar functionality would be implemented here
              </p>
              <p className="text-sm text-muted-foreground">
                Features: Project timelines, task deadlines, team schedules,
                client meetings
              </p>

              {/* Simple Month View Placeholder */}
              <div className="max-w-2xl mx-auto mt-8">
                <div className="flex items-center justify-between mb-4">
                  <Button variant="ghost" size="sm">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h4 className="text-lg font-semibold">January 2025</h4>
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-sm">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                    (day) => (
                      <div
                        key={day}
                        className="p-2 text-center font-medium text-muted-foreground"
                      >
                        {day}
                      </div>
                    )
                  )}
                  {Array.from({ length: 35 }, (_, i) => {
                    const day = i - 6 + 1;
                    const isCurrentMonth = day > 0 && day <= 31;
                    const isToday = day === 15; // Mock today

                    return (
                      <div
                        key={i}
                        className={`p-2 text-center border border-border hover:bg-secondary cursor-pointer ${
                          !isCurrentMonth ? 'text-muted-foreground' : ''
                        } ${
                          isToday ? 'bg-primary text-primary-foreground' : ''
                        }`}
                      >
                        {isCurrentMonth ? day : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
