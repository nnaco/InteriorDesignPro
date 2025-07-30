import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Image,
  Box,
  Pencil,
  MoreVertical,
  Grid3X3,
  List,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface FileGridProps {
  projectFilter: string;
  onProjectFilterChange: (project: string) => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
}

export function FileGrid({
  projectFilter,
  onProjectFilterChange,
  typeFilter,
  onTypeFilterChange,
}: FileGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey:
      projectFilter === 'all'
        ? ['/api/documents']
        : ['/api/documents', { projectId: projectFilter }],
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await apiRequest('DELETE', `/api/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    },
  });

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FileText className="h-6 w-6" />;

    if (fileType.includes('pdf')) {
      return <FileText className="h-6 w-6 text-red-600" />;
    } else if (fileType.includes('image')) {
      return <Image className="h-6 w-6 text-blue-600" />;
    } else if (fileType.includes('dwg') || fileType.includes('cad')) {
      return <Pencil className="h-6 w-6 text-purple-600" />;
    } else if (fileType.includes('skp') || fileType.includes('3d')) {
      return <Box className="h-6 w-6 text-green-600" />;
    }

    return <FileText className="h-6 w-6 text-gray-600" />;
  };

  const getFileTypeColor = (fileType?: string) => {
    if (!fileType) return 'file-default';

    if (fileType.includes('pdf')) return 'file-pdf';
    if (fileType.includes('image')) return 'file-image';
    if (fileType.includes('dwg') || fileType.includes('cad')) return 'file-cad';
    if (fileType.includes('skp') || fileType.includes('3d')) return 'file-3d';

    return 'file-default';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return 'General';
    const project = projects.find((p: any) => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const filteredDocuments = documents.filter((doc: any) => {
    if (typeFilter !== 'all') {
      const matchesType = doc.fileType?.includes(typeFilter);
      if (!matchesType) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={projectFilter} onValueChange={onProjectFilterChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project: any) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={onTypeFilterChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All File Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All File Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="pdf">PDF Documents</SelectItem>
              <SelectItem value="cad">CAD Files</SelectItem>
              <SelectItem value="3d">3D Models</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredDocuments.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No documents found</p>
          </div>
        ) : (
          filteredDocuments.map((document: any) => (
            <Card
              key={document.id}
              className="border border-border hover:shadow-material transition-shadow cursor-pointer"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${getFileTypeColor(
                      document.fileType
                    )}`}
                  >
                    {getFileIcon(document.fileType)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Download</DropdownMenuItem>
                      <DropdownMenuItem>Share</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(document.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h4 className="font-medium text-foreground text-sm mb-1 line-clamp-2">
                  {document.name}
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  {getProjectName(document.projectId)}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatFileSize(document.fileSize)}</span>
                  <span>{format(new Date(document.createdAt), 'MMM d')}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
