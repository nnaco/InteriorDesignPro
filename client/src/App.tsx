import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import Tasks from "@/pages/Tasks";
import Team from "@/pages/Team";
import Documents from "@/pages/Documents";
import Calendar from "@/pages/Calendar";
import Messages from "@/pages/Messages";
import Settings from "@/pages/Settings";
import Admin from "@/pages/Admin";
import ProjectManagement from "@/pages/ProjectManagement";
import ClientPortalPage from "@/pages/ClientPortalPage";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/projects" component={Projects} />
          <Route path="/projects/:id" component={Projects} />
          <Route path="/project-management" component={ProjectManagement} />
          <Route path="/client-portal" component={ClientPortalPage} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/team" component={Team} />
          <Route path="/documents" component={Documents} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/messages" component={Messages} />
          <Route path="/settings" component={Settings} />
          <Route path="/admin" component={Admin} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
