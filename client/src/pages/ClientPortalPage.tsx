import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientPortal } from "@/components/client-portal/ClientPortal";
import { Users, Eye } from "lucide-react";

export default function ClientPortalPage() {
  const [selectedClient, setSelectedClient] = useState<string>("");

  // Fetch clients for selection
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
  });

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Client Portal</h1>
            <p className="text-gray-600">
              Enhanced client experience with project updates, documents, and communication
            </p>
          </div>
        </div>

        {/* Client Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Client Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Client</label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client to view their portal" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client: any) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedClient && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Eye className="h-4 w-4" />
                  Viewing portal as: {clients.find((c: any) => c.id === selectedClient)?.name}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client Portal */}
        {selectedClient ? (
          <ClientPortal clientId={selectedClient} />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No Client Selected</h3>
                <p>Please select a client to view their portal experience</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}