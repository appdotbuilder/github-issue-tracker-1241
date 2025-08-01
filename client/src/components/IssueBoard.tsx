
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, User, AlertCircle, Clock, MessageSquare } from 'lucide-react';
import { IssueForm } from '@/components/IssueForm';
import { IssueDetail } from '@/components/IssueDetail';
import type { Project, Issue, User as UserType } from '../../../server/src/schema';

interface IssueBoardProps {
  project: Project;
  issues: Issue[];
  users: UserType[];
  currentUser: UserType | null;
  onIssueUpdated: () => void;
}

export function IssueBoard({ project, issues, users, currentUser, onIssueUpdated }: IssueBoardProps) {
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  const handleIssueCreated = useCallback(() => {
    setShowIssueForm(false);
    onIssueUpdated();
  }, [onIssueUpdated]);

  const handleIssueUpdated = useCallback(() => {
    setSelectedIssue(null);
    onIssueUpdated();
  }, [onIssueUpdated]);

  const filteredIssues = issues.filter((issue: Issue) => {
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false;
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned' && issue.assigned_to !== null) return false;
      if (assigneeFilter !== 'unassigned' && issue.assigned_to !== parseInt(assigneeFilter)) return false;
    }
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAssignedUser = (userId: number | null) => {
    if (!userId) return null;
    return users.find((user: UserType) => user.id === userId);
  };

  if (selectedIssue) {
    return (
      <IssueDetail
        issue={selectedIssue}
        project={project}
        users={users}
        currentUser={currentUser}
        onBack={() => setSelectedIssue(null)}
        onIssueUpdated={handleIssueUpdated}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🐛 Issues</h2>
          <p className="text-gray-600">{project.name}</p>
        </div>
        <Button 
          onClick={() => setShowIssueForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Issue
        </Button>
      </div>

      {showIssueForm && (
        <IssueForm
          project={project}
          users={users}
          currentUser={currentUser}
          onSubmit={handleIssueCreated}
          onCancel={() => setShowIssueForm(false)}
        />
      )}

      {/* Filters */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Assignee</label>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((user: UserType) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setAssigneeFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues Grid */}
      {filteredIssues.length === 0 ? (
        <Card className="text-center py-12 bg-white/80 backdrop-blur-sm">
          <CardContent>
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {issues.length === 0 ? 'No issues yet' : 'No issues match your filters'}
            </h3>
            <p className="text-gray-500 mb-4">
              {issues.length === 0 
                ? 'Create your first issue to start tracking bugs and tasks'
                : 'Try adjusting your filters to see more issues'
              }
            </p>
            {issues.length === 0 && (
              <Button 
                onClick={() => setShowIssueForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Issue
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredIssues.map((issue: Issue) => {
            const assignedUser = getAssignedUser(issue.assigned_to);
            return (
              <Card 
                key={issue.id} 
                className="cursor-pointer transition-all hover:shadow-lg bg-white/80 backdrop-blur-sm"
                onClick={() => setSelectedIssue(issue)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
                      {issue.title}
                    </CardTitle>
                    <div className="flex items-center space-x-1">
                      {issue.priority === 'critical' && (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={getPriorityColor(issue.priority)}>
                      {issue.priority}
                    </Badge>
                    <Badge className={getStatusColor(issue.status)}>
                      {issue.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {issue.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {issue.description}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    {assignedUser && (
                      <div className="flex items-center space-x-2 text-sm">
                        <User className="h-3 w-3 text-gray-500" />
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={assignedUser.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {assignedUser.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-gray-700">{assignedUser.name}</span>
                      </div>
                    )}
                    
                    {issue.due_date && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-3 w-3" />
                        <span>Due {issue.due_date.toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Updated {issue.updated_at.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>#{issue.id}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
