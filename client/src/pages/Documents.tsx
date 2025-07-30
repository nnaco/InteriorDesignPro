import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { FileUpload } from '@/components/documents/FileUpload';
import { FileGrid } from '@/components/documents/FileGrid';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';

export default function Documents() {
  const [projectFilter, setProjectFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

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
      <MainLayout title="Documents">
        <div>Loading...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Documents">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Documents</h2>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </div>

        {/* File Upload */}
        <FileUpload
          projectId={projectFilter === 'all' ? undefined : projectFilter}
        />

        {/* File Browser */}
        <FileGrid
          projectFilter={projectFilter}
          onProjectFilterChange={setProjectFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
        />
      </div>
    </MainLayout>
  );
}
