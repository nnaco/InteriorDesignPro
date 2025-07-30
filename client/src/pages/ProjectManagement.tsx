import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, BarChart3, Clock, FileText, Layout } from 'lucide-react';
import { GanttChart } from '@/components/gantt/GanttChart';
import { TimeTracker } from '@/components/time-tracking/TimeTracker';
import { InvoiceGenerator } from '@/components/invoicing/InvoiceGenerator';
import { ProjectTemplates } from '@/components/templates/ProjectTemplates';
import { format } from 'date-fns';

export default function ProjectManagement() {
  const [selectedProject, setSelectedProject] = useState<string>('');

  // Fetch projects for selection
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Advanced Project Management</h1>
            <p className="text-gray-600">
              Comprehensive project visualization, time tracking, and client
              management tools
            </p>
          </div>
        </div>

        {/* Project Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Project Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Project</label>
                <Select
                  value={selectedProject}
                  onValueChange={setSelectedProject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a project to manage" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project: any) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProject && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Details</label>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const project = projects.find(
                        (p: any) => p.id === selectedProject
                      );
                      if (!project) return null;

                      const getStatusColor = (status: string) => {
                        switch (status) {
                          case 'active':
                            return 'bg-green-100 text-green-800';
                          case 'planning':
                            return 'bg-blue-100 text-blue-800';
                          case 'on_hold':
                            return 'bg-yellow-100 text-yellow-800';
                          case 'completed':
                            return 'bg-gray-100 text-gray-800';
                          default:
                            return 'bg-gray-100 text-gray-800';
                        }
                      };

                      return (
                        <div className="flex items-center gap-4">
                          <Badge className={getStatusColor(project.status)}>
                            {project.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            Budget: ${project.budget?.toLocaleString() || 'N/A'}
                          </span>
                          {project.dueDate && (
                            <span className="text-sm text-gray-600">
                              Due:{' '}
                              {format(new Date(project.dueDate), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Features Tabs */}
        <Tabs defaultValue="gantt" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="gantt" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Gantt Chart
            </TabsTrigger>
            <TabsTrigger
              value="time-tracking"
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Time Tracking
            </TabsTrigger>
            <TabsTrigger value="invoicing" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Invoicing
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gantt" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">
                  Project Timeline Visualization
                </h3>
                <p className="text-gray-600">
                  Interactive Gantt chart showing task dependencies, timeline,
                  and project progress
                </p>
              </div>
              {selectedProject ? (
                <GanttChart projectId={selectedProject} />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8 text-gray-500">
                      Please select a project to view the Gantt chart
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="time-tracking" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">
                  Time Tracking & Management
                </h3>
                <p className="text-gray-600">
                  Track time spent on tasks, generate reports, and manage
                  project billing
                </p>
              </div>
              {selectedProject ? (
                <TimeTracker projectId={selectedProject} />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8 text-gray-500">
                      Please select a project to start time tracking
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="invoicing" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">
                  Invoice Generation & Management
                </h3>
                <p className="text-gray-600">
                  Create professional invoices, track payments, and manage
                  client billing
                </p>
              </div>
              {selectedProject ? (
                (() => {
                  const project = projects.find(
                    (p: any) => p.id === selectedProject
                  );
                  return (
                    <InvoiceGenerator
                      projectId={selectedProject}
                      clientId={project?.clientId}
                    />
                  );
                })()
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8 text-gray-500">
                      Please select a project to generate invoices
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">
                  Project Templates & Automation
                </h3>
                <p className="text-gray-600">
                  Create reusable project templates to standardize workflows and
                  accelerate project setup
                </p>
              </div>
              <ProjectTemplates />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
