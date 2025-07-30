import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Box } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <Card className="material-shadow-lg max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <Box className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            DesignFlow
          </h1>
          <p className="text-muted-foreground mb-8">
            Interior Design Project Management Platform
          </p>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Welcome to DesignFlow, your comprehensive platform for managing
              interior design projects, collaborating with teams, and delivering
              exceptional results to clients.
            </p>

            <Button
              className="w-full"
              onClick={() => (window.location.href = '/api/login')}
            >
              Sign In to Continue
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Need access? Contact your administrator
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
