import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Send, Plus, X, Calculator } from 'lucide-react';
import { format } from 'date-fns';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  clientId: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  issueDate: string;
  dueDate: string;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  items: InvoiceItem[];
  notes?: string;
}

interface InvoiceGeneratorProps {
  projectId?: string;
  clientId?: string;
}

export function InvoiceGenerator({
  projectId,
  clientId,
}: InvoiceGeneratorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    projectId: projectId || '',
    clientId: clientId || '',
    dueDate: '',
    taxRate: 0,
    notes: '',
  });
  const [items, setItems] = useState<Omit<InvoiceItem, 'id'>[]>([
    { description: '', quantity: 1, rate: 0, amount: 0 },
  ]);
  const { toast } = useToast();

  // Fetch projects and clients for selection
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
  });
  console.log('clie', clientId);

  // Fetch existing invoices
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: [`/api/invoices?clientId=${clientId}&projectId=${projectId}`],
  });

  // Fetch time entries for auto-generation
  const { data: timeEntries = [] } = useQuery({
    queryKey: ['/api/time-tracking/entries', { projectId }],
    enabled: !!projectId,
  });

  // Create invoice mutation
  const createInvoice = useMutation({
    mutationFn: async (invoiceData: any) => {
      return apiRequest('POST', '/api/invoices', invoiceData);
    },
    onSuccess: () => {
      toast({
        title: 'Invoice Created',
        description: 'Invoice has been generated successfully.',
      });
      setIsCreating(false);
      resetForm();
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: 'Failed to create invoice. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      projectId: projectId || '',
      clientId: clientId || '',
      dueDate: '',
      taxRate: 0,
      notes: '',
    });
    setItems([{ description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof Omit<InvoiceItem, 'id'>,
    value: any
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate amount
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }

    setItems(newItems);
  };

  const autoGenerateFromTimeEntries = () => {
    if (!timeEntries.length) {
      toast({
        title: 'No Time Entries',
        description: 'No time entries found for this project.',
        variant: 'destructive',
      });
      return;
    }

    // Group time entries by task and calculate total hours
    const taskGroups = timeEntries.reduce((acc: any, entry: any) => {
      if (!acc[entry.taskId]) {
        acc[entry.taskId] = {
          taskTitle: entry.taskTitle,
          totalMinutes: 0,
          entries: [],
        };
      }
      acc[entry.taskId].totalMinutes += entry.duration;
      acc[entry.taskId].entries.push(entry);
      return acc;
    }, {});

    // Convert to invoice items
    const newItems = Object.values(taskGroups).map((group: any) => ({
      description: `${group.taskTitle} - Time tracking`,
      quantity: Math.round((group.totalMinutes / 60) * 100) / 100, // Hours with 2 decimal places
      rate: 75, // Default hourly rate
      amount: Math.round((group.totalMinutes / 60) * 75 * 100) / 100,
    }));

    setItems(newItems as Omit<InvoiceItem, 'id'>[]);
    toast({
      title: 'Items Generated',
      description: `Generated ${newItems.length} invoice items from time entries.`,
    });
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * (formData.taxRate / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectId || !formData.clientId) {
      toast({
        title: 'Missing Information',
        description: 'Please select both project and client.',
        variant: 'destructive',
      });
      return;
    }

    if (items.length === 0 || items.every((item) => !item.description)) {
      toast({
        title: 'No Items',
        description: 'Please add at least one invoice item.',
        variant: 'destructive',
      });
      return;
    }

    const invoiceData = {
      ...formData,
      items: items.filter((item) => item.description),
      subtotal,
      taxAmount,
      total,
    };

    createInvoice.mutate(invoiceData);
  };

  if (!isCreating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoices
            </span>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceList invoices={invoices} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Invoice
          </span>
          <Button variant="outline" onClick={() => setIsCreating(false)}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project and Client Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) =>
                  setFormData({ ...formData, projectId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Client</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) =>
                  setFormData({ ...formData, clientId: value })
                }
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
          </div>

          {/* Due Date and Tax */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.taxRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    taxRate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          {/* Auto-generate button */}
          {projectId && timeEntries.length > 0 && (
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={autoGenerateFromTimeEntries}
                className="flex items-center gap-2"
              >
                <Calculator className="h-4 w-4" />
                Auto-generate from Time Entries
              </Button>
            </div>
          )}

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Invoice Items</Label>
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-5">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(index, 'description', e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      min="0"
                      // step="0.01"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          index,
                          'quantity',
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Rate"
                      min="0"
                      // step="0.01"
                      value={item.rate}
                      onChange={(e) =>
                        updateItem(
                          index,
                          'rate',
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={item.amount.toFixed(2)}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="col-span-1">
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({formData.taxRate}%):</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional notes or terms..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button type="submit" disabled={createInvoice.isPending}>
              Create Invoice
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface InvoiceListProps {
  invoices: Invoice[];
}

function InvoiceList({ invoices }: InvoiceListProps) {
  if (!invoices.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No invoices created yet
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <div key={invoice.id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-medium">{invoice.invoiceNumber}</h4>
              <p className="text-sm text-gray-600">
                Due: {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="text-right">
              <div className="font-bold">
                ${parseFloat(invoice.total).toFixed(2)}
              </div>
              <Badge className={getStatusColor(invoice.status)}>
                {invoice.status}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm">
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
