import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FolderOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface AnalyticsData {
  overview: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalTasks: number;
    completedTasks: number;
    totalUsers: number;
    totalDocuments: number;
    totalMessages: number;
  };
  projectMetrics: {
    projectsByStatus: Array<{ status: string; count: number }>;
    projectsCompletionRate: number;
    averageProjectDuration: number;
  };
  taskMetrics: {
    tasksByStatus: Array<{ status: string; count: number }>;
    tasksByPriority: Array<{ priority: string; count: number }>;
    taskCompletionRate: number;
    overdueTasks: number;
    averageTaskCompletionTime: number;
  };
  userMetrics: {
    usersByRole: Array<{ role: string; count: number }>;
    mostActiveUsers: Array<{
      userId: string;
      email: string;
      taskCount: number;
    }>;
    userProductivity: Array<{
      userId: string;
      email: string;
      completedTasks: number;
    }>;
  };
  timeSeriesData: {
    projectsCreatedOverTime: Array<{ date: string; count: number }>;
    tasksCompletedOverTime: Array<{ date: string; count: number }>;
    documentsUploadedOverTime: Array<{ date: string; count: number }>;
  };
}

const COLORS = [
  '#2563eb',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
];

const AdvancedAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [selectedView, setSelectedView] = React.useState<
    'overview' | 'projects' | 'tasks' | 'users'
  >('overview');

  const {
    data: analyticsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['/api/analytics', dateRange?.from, dateRange?.to],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const data: AnalyticsData = analyticsData || {
    overview: {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      totalTasks: 0,
      completedTasks: 0,
      totalUsers: 0,
      totalDocuments: 0,
      totalMessages: 0,
    },
    projectMetrics: {
      projectsByStatus: [],
      projectsCompletionRate: 0,
      averageProjectDuration: 0,
    },
    taskMetrics: {
      tasksByStatus: [],
      tasksByPriority: [],
      taskCompletionRate: 0,
      overdueTasks: 0,
      averageTaskCompletionTime: 0,
    },
    userMetrics: { usersByRole: [], mostActiveUsers: [], userProductivity: [] },
    timeSeriesData: {
      projectsCreatedOverTime: [],
      tasksCompletedOverTime: [],
      documentsUploadedOverTime: [],
    },
  };

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
    trend?: number;
    subtitle?: string;
  }> = ({ title, value, icon, trend, subtitle }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div
                className={`flex items-center mt-2 text-xs ${
                  trend > 0
                    ? 'text-green-600'
                    : trend < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {trend > 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : trend < 0 ? (
                  <TrendingDown className="w-3 h-3 mr-1" />
                ) : null}
                {trend !== 0 && `${Math.abs(trend)}%`}
              </div>
            )}
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your design projects
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
            className="w-full sm:w-auto"
          />
          <Select
            value={selectedView}
            onValueChange={(v: any) => setSelectedView(v)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="projects">Projects</SelectItem>
              <SelectItem value="tasks">Tasks</SelectItem>
              <SelectItem value="users">Users</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => refetch()} variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      {selectedView === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Projects"
              value={data.overview.totalProjects}
              icon={<FolderOpen className="h-5 w-5" />}
              subtitle={`${data.overview.activeProjects} active`}
            />
            <StatCard
              title="Completed Tasks"
              value={data.overview.completedTasks}
              icon={<CheckCircle className="h-5 w-5" />}
              subtitle={`${data.taskMetrics.taskCompletionRate.toFixed(
                1
              )}% completion rate`}
            />
            <StatCard
              title="Team Members"
              value={data.overview.totalUsers}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              title="Overdue Tasks"
              value={data.taskMetrics.overdueTasks}
              icon={<AlertCircle className="h-5 w-5" />}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Project Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.projectMetrics.projectsByStatus}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {data.projectMetrics.projectsByStatus.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Task Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Task Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.taskMetrics.tasksByPriority}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priority" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Projects Created Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Projects Created Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.timeSeriesData.projectsCreatedOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#2563eb"
                      fill="#2563eb"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tasks Completed Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Tasks Completed Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.timeSeriesData.tasksCompletedOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* User Productivity */}
      {selectedView === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Most Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.userMetrics.mostActiveUsers
                  .slice(0, 10)
                  .map((user, index) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.taskCount} tasks
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{user.taskCount}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Roles Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.userMetrics.usersByRole}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ role, count }) => `${role}: ${count}`}
                  >
                    {data.userMetrics.usersByRole.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600">
              {data.projectMetrics.projectsCompletionRate.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">
              Project Completion Rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {data.projectMetrics.averageProjectDuration}
            </div>
            <p className="text-sm text-muted-foreground">
              Avg Project Duration (days)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {data.taskMetrics.averageTaskCompletionTime}
            </div>
            <p className="text-sm text-muted-foreground">
              Avg Task Completion (days)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
