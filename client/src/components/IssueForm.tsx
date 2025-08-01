
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { trpc } from '@/utils/trpc';
import type { Project, User, CreateIssueInput } from '../../../server/src/schema';

interface IssueFormProps {
  project: Project;
  users: User[];
  currentUser: User | null;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function IssueForm({ project, users, currentUser, onSubmit, onCancel, isLoading = false }: IssueFormProps) {
  const [formData, setFormData] = useState<CreateIssueInput>({
    project_id: project.id,
    title: '',
    description: null,
    priority: 'medium',
    status: 'open',
    assigned_to: null,
    created_by: currentUser?.id || 0,
    due_date: null
  });

  const [submitting, setSubmitting] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSubmitting(true);
    try {
      await trpc.createIssue.mutate(formData);
      onSubmit();
    } catch (error) {
      console.error('Failed to create issue:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>🐛 Create New Issue</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Brief description of the issue"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateIssueInput) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of the issue..."
              value={formData.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateIssueInput) => ({
                  ...prev,
                  description: e.target.value || null
                }))
              }
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority || 'medium'} 
                onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') =>
                  setFormData((prev: CreateIssueInput) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="critical">🔴 Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status || 'open'} 
                onValueChange={(value: 'open' | 'in_progress' | 'closed' | 'resolved') =>
                  setFormData((prev: CreateIssueInput) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">📭 Open</SelectItem>
                  <SelectItem value="in_progress">⚡ In Progress</SelectItem>
                  <SelectItem value="resolved">✅ Resolved</SelectItem>
                  <SelectItem value="closed">🗂️ Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="assigned_to">Assign to</Label>
            <Select 
              value={formData.assigned_to?.toString() || 'none'} 
              onValueChange={(value: string) =>
                setFormData((prev: CreateIssueInput) => ({ 
                  ...prev, 
                  assigned_to: value === 'none' ? null : parseInt(value) 
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assignee (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {users.map((user: User) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Due Date</Label>
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? format(formData.due_date, 'PPP') : 'Select due date (optional)'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.due_date || undefined}
                  onSelect={(date: Date | undefined) => {
                    setFormData((prev: CreateIssueInput) => ({ 
                      ...prev, 
                      due_date: date || null 
                    }));
                    setShowCalendar(false);
                  }}
                  disabled={(date: Date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={submitting || isLoading || !currentUser}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {submitting ? 'Creating...' : '🚀 Create Issue'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
