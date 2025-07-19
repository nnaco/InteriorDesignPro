import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, FileText, MessageSquare, CreditCard, Eye, Download } from "lucide-react";
import { format } from "date-fns";

interface ClientProject {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  startDate: string;
  dueDate: string;
  budget: number;
  spent: number;
}

interface ClientPortalProps {
  clientId: string;
}

export function ClientPortal({ clientId }: ClientPortalProps) {
  // Fetch client projects
  const { data: projects = [] } = useQuery<ClientProject[]>({
    queryKey: ['/api/client-portal/projects', clientId],
  });

  // Fetch client invoices
  const { data: invoices = [] } = useQuery({
    queryKey: ['/api/client-portal/invoices', clientId],
  });

  // Fetch client messages
  const { data: messages = [] } = useQuery({
    queryKey: ['/api/client-portal/messages', clientId],
  });

  // Fetch client documents
  const { data: documents = [] } = useQuery({
    queryKey: ['/api/client-portal/documents', clientId],
  });

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback>CL</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">Welcome to Your Project Portal</h1>
              <p className="text-gray-600">
                Track your projects, view documents, and communicate with your design team
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portal Tabs */}
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-6">
            {projects.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-gray-500">
                    No projects assigned yet
                  </div>
                </CardContent>
              </Card>
            ) : (
              projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))
            )}
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <DocumentsGrid documents={documents} />
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <InvoicesTable invoices={invoices} />
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <MessagesCenter messages={messages} clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ProjectCardProps {
  project: ClientProject;
}

function ProjectCard({ project }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{project.name}</CardTitle>
          <Badge className={getStatusColor(project.status)}>
            {project.status.replace('_', ' ')}
          </Badge>
        </div>
        <p className="text-gray-600">{project.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Project Progress</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Start Date</p>
            <p className="font-medium">{format(new Date(project.startDate), 'MMM d, yyyy')}</p>
          </div>
          <div>
            <p className="text-gray-500">Due Date</p>
            <p className="font-medium">{format(new Date(project.dueDate), 'MMM d, yyyy')}</p>
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Budget Utilization</span>
            <span>${project.spent.toLocaleString()} / ${project.budget.toLocaleString()}</span>
          </div>
          <Progress 
            value={(project.spent / project.budget) * 100} 
            className="h-2"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Message Team
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface DocumentsGridProps {
  documents: any[];
}

function DocumentsGrid({ documents }: DocumentsGridProps) {
  if (!documents.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-gray-500">
            No documents shared yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => (
        <Card key={doc.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{doc.filename}</h4>
                <p className="text-sm text-gray-500">
                  {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                </p>
                <p className="text-sm text-gray-500">
                  {Math.round(doc.size / 1024)} KB
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface InvoicesTableProps {
  invoices: any[];
}

function InvoicesTable({ invoices }: InvoicesTableProps) {
  if (!invoices.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-gray-500">
            No invoices available
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">{invoice.invoiceNumber}</h4>
                <p className="text-sm text-gray-600">
                  Issued: {format(new Date(invoice.issueDate), 'MMM d, yyyy')}
                </p>
                <p className="text-sm text-gray-600">
                  Due: {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">${invoice.total.toFixed(2)}</div>
                <Badge className={getStatusColor(invoice.status)}>
                  {invoice.status}
                </Badge>
                <div className="mt-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface MessagesCenterProps {
  messages: any[];
  clientId: string;
}

function MessagesCenter({ messages, clientId }: MessagesCenterProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Communication</CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No messages yet. Start a conversation with your design team.
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {message.senderName?.charAt(0) || 'T'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{message.senderName}</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(message.createdAt), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t">
          <Button className="w-full">
            <MessageSquare className="h-4 w-4 mr-2" />
            Send New Message
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}