import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Layout, Copy, Plus, Eye, Trash2, Home, Building, Palette } from "lucide-react";

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedDuration: number;
  estimatedBudget: number;
  tasks: TemplateTask[];
  milestones: TemplateMilestone[];
  isPublic: boolean;
  createdBy: string;
  usageCount: number;
}

interface TemplateTask {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  dependencies: string[];
  phase: string;
  priority: string;
}

interface TemplateMilestone {
  id: string;
  title: string;
  description: string;
  daysFromStart: number;
}

export function ProjectTemplates() {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [] } = useQuery<ProjectTemplate[]>({
    queryKey: ['/api/project-templates'],
  });

  // Create project from template
  const createFromTemplate = useMutation({
    mutationFn: async (data: { templateId: string; projectName: string; clientId: string; startDate: string }) => {
      return apiRequest('/api/projects/from-template', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Project Created",
        description: "Project has been created from template successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project from template.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Templates</h2>
          <p className="text-gray-600">
            Create new projects quickly using pre-defined templates
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Template Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onUse={(template) => setSelectedTemplate(template)}
          />
        ))}
      </div>

      {/* Create Template Dialog */}
      <CreateTemplateDialog
        open={isCreating}
        onOpenChange={setIsCreating}
      />

      {/* Use Template Dialog */}
      <UseTemplateDialog
        template={selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onCreateProject={createFromTemplate.mutate}
        isCreating={createFromTemplate.isPending}
      />
    </div>
  );
}

interface TemplateCardProps {
  template: ProjectTemplate;
  onUse: (template: ProjectTemplate) => void;
}

function TemplateCard({ template, onUse }: TemplateCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'residential': return <Home className="h-5 w-5" />;
      case 'commercial': return <Building className="h-5 w-5" />;
      case 'renovation': return <Palette className="h-5 w-5" />;
      default: return <Layout className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'residential': return 'bg-blue-100 text-blue-800';
      case 'commercial': return 'bg-green-100 text-green-800';
      case 'renovation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getCategoryIcon(template.category)}
            <div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <Badge className={getCategoryColor(template.category)}>
                {template.category}
              </Badge>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">{template.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Duration</p>
            <p className="font-medium">{template.estimatedDuration} days</p>
          </div>
          <div>
            <p className="text-gray-500">Budget</p>
            <p className="font-medium">${template.estimatedBudget.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Tasks</p>
            <p className="font-medium">{template.tasks.length}</p>
          </div>
          <div>
            <p className="text-gray-500">Used</p>
            <p className="font-medium">{template.usageCount} times</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            className="flex-1"
            onClick={() => onUse(template)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Use Template
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <TemplatePreview template={template} />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateTemplateDialog({ open, onOpenChange }: CreateTemplateDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    estimatedDuration: 0,
    estimatedBudget: 0,
  });
  const [tasks, setTasks] = useState<Omit<TemplateTask, 'id'>[]>([]);
  const [milestones, setMilestones] = useState<Omit<TemplateMilestone, 'id'>[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTemplate = useMutation({
    mutationFn: async (templateData: any) => {
      return apiRequest('/api/project-templates', {
        method: 'POST',
        body: templateData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Template Created",
        description: "Project template has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/project-templates'] });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      estimatedDuration: 0,
      estimatedBudget: 0,
    });
    setTasks([]);
    setMilestones([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTemplate.mutate({
      ...formData,
      tasks,
      milestones,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Project Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="renovation">Renovation</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duration (days)</Label>
                <Input
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({...formData, estimatedDuration: parseInt(e.target.value) || 0})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Budget ($)</Label>
                <Input
                  type="number"
                  value={formData.estimatedBudget}
                  onChange={(e) => setFormData({...formData, estimatedBudget: parseInt(e.target.value) || 0})}
                  required
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button type="submit" disabled={createTemplate.isPending}>
              Create Template
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface UseTemplateDialogProps {
  template: ProjectTemplate | null;
  onClose: () => void;
  onCreateProject: (data: any) => void;
  isCreating: boolean;
}

function UseTemplateDialog({ template, onClose, onCreateProject, isCreating }: UseTemplateDialogProps) {
  const [projectData, setProjectData] = useState({
    projectName: "",
    clientId: "",
    startDate: "",
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
  });

  if (!template) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateProject({
      templateId: template.id,
      ...projectData,
    });
  };

  return (
    <Dialog open={!!template} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Project from Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Template: {template.name}</Label>
            <p className="text-sm text-gray-600">{template.description}</p>
          </div>

          <div className="space-y-2">
            <Label>Project Name</Label>
            <Input
              value={projectData.projectName}
              onChange={(e) => setProjectData({...projectData, projectName: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Client</Label>
            <Select
              value={projectData.clientId}
              onValueChange={(value) => setProjectData({...projectData, clientId: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client: any) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={projectData.startDate}
              onChange={(e) => setProjectData({...projectData, startDate: e.target.value})}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isCreating}>
              Create Project
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface TemplatePreviewProps {
  template: ProjectTemplate;
}

function TemplatePreview({ template }: TemplatePreviewProps) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{template.name}</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4">
        <p className="text-gray-600">{template.description}</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium">Duration</h4>
            <p>{template.estimatedDuration} days</p>
          </div>
          <div>
            <h4 className="font-medium">Budget</h4>
            <p>${template.estimatedBudget.toLocaleString()}</p>
          </div>
        </div>

        {template.tasks.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Tasks ({template.tasks.length})</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {template.tasks.map((task, index) => (
                <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-gray-600">{task.estimatedHours}h • {task.priority} priority</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {template.milestones.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Milestones ({template.milestones.length})</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {template.milestones.map((milestone, index) => (
                <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                  <div className="font-medium">{milestone.title}</div>
                  <div className="text-gray-600">Day {milestone.daysFromStart}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}