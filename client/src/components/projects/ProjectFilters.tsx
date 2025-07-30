import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

interface ProjectFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  clientFilter: string;
  onClientChange: (client: string) => void;
  clients: string[];
}

export function ProjectFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  clientFilter,
  onClientChange,
  clients,
}: ProjectFiltersProps) {
  return (
    <Card className="material-shadow">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4">
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={clientFilter} onValueChange={onClientChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client} value={client}>
                  {client}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="search"
              placeholder="Search projects..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
