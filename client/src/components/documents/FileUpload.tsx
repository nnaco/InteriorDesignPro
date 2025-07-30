import { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CloudUpload, File, X } from 'lucide-react';

interface FileUploadProps {
  projectId?: string;
}

export function FileUpload({ projectId }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      if (projectId) {
        formData.append('projectId', projectId);
      }

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
    },
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    for (const file of selectedFiles) {
      await uploadMutation.mutateAsync(file);
    }
    setSelectedFiles([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="material-shadow">
      <CardContent className="p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <CloudUpload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">
            Drag and drop files here
          </p>
          <p className="text-muted-foreground mb-4">
            or click to browse and upload
          </p>
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              Browse Files
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.dwg,.skp,.rvt"
              />
            </label>
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Supported: PDF, JPG, PNG, DWG, SKP, RVT (Max 50MB)
          </p>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-foreground mb-3">Selected Files</h4>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={uploadFiles} disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? 'Uploading...' : 'Upload Files'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
