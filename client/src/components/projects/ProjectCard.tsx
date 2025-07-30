import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'wouter';
import { format } from 'date-fns';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string;
    clientName?: string;
    status: string;
    progress?: number;
    startDate?: string;
    endDate?: string;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'planning':
        return 'secondary';
      case 'on_hold':
        return 'outline';
      case 'completed':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'planning':
        return 'status-planning';
      case 'on_hold':
        return 'status-on_hold';
      case 'completed':
        return 'status-completed';
      default:
        return '';
    }
  };

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="material-shadow card-hover cursor-pointer overflow-hidden">
        {/* Project image placeholder */}
        <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <div className="text-4xl text-primary/40">🏠</div>
        </div>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground truncate">
              {project.name}
            </h3>
            <Badge
              variant={getStatusVariant(project.status)}
              className={`text-xs ${getStatusColor(project.status)}`}
            >
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
          {project.clientName && (
            <p className="text-muted-foreground text-sm mb-4">
              {project.clientName}
            </p>
          )}

          {typeof project.progress === 'number' && (
            <>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="mb-4" />
            </>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {project.startDate && (
              <span>
                Started: {format(new Date(project.startDate), 'MMM d, yyyy')}
              </span>
            )}
            {project.endDate && (
              <span>
                Due: {format(new Date(project.endDate), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
