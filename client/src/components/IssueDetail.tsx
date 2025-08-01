
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, MessageSquare, Paperclip, Send, Edit2, Save, X } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Issue, Project, User as UserType, Comment, Attachment, UpdateIssueInput, CreateCommentInput } from '../../../server/src/schema';

interface IssueDetailProps {
  issue: Issue;
  project: Project;
  users: UserType[];
  currentUser: UserType | null;
  onBack: () => void;
  onIssueUpdated: () => void;
}

export function IssueDetail({ issue, project, users, currentUser, onBack, onIssueUpdated }: IssueDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpdatingIssue, setIsUpdatingIssue] = useState(false);

  const [editData, setEditData] = useState<UpdateIssueInput>({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    priority: issue.priority,
    status: issue.status,
    assigned_to: issue.assigned_to,
    due_date: issue.due_date
  });

  const loadComments = useCallback(async () => {
    try {
      const result = await trpc.getIssueComments.query({ issueId: issue.id });
      setComments(result);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  }, [issue.id]);

  const loadAttachments = useCallback(async () => {
    try {
      const result = await trpc.getIssueAttachments.query({ issueId: issue.id });
      setAttachments(result);
    } catch (error) {
      console.error('Failed to load attachments:', error);
    }
  }, [issue.id]);

  useEffect(() => {
    loadComments();
    loadAttachments();
  }, [loadComments, loadAttachments]);

  const handleUpdateIssue = async () => {
    if (!currentUser) return;

    setIsUpdatingIssue(true);
    try {
      await trpc.updateIssue.mutate(editData);
      setIsEditing(false);
      onIssueUpdated();
    } catch (error) {
      console.error('Failed to update issue:', error);
    } finally {
      setIsUpdatingIssue(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const commentData: CreateCommentInput = {
        issue_id: issue.id,
        user_id: currentUser.id,
        content: newComment.trim()
      };
      await trpc.createComment.mutate(commentData);
      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getAssignedUser = (userId: number | null) => {
    if (!userId) return null;
    return users.find((user: UserType) => user.id === userId);
  };

  const getCreatedByUser = (userId: number) => {
    return users.find((user: UserType) => user.id === userId);
  };

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

  const assignedUser = getAssignedUser(issue.assigned_to);
  const createdByUser = getCreatedByUser(issue.created_by);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Issues
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Issue #{issue.id}</h2>
            <p className="text-gray-600">{project.name}</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => setIsEditing(!isEditing)}
          disabled={isUpdatingIssue}
        >
          {isEditing ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Details */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                {isEditing ? (
                  <Input
                    value={editData.title || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditData((prev: UpdateIssueInput) => ({ ...prev, title: e.target.value }))
                    }
                    className="text-xl font-semibold"
                  />
                ) : (
                  <CardTitle className="text-xl">{issue.title}</CardTitle>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <>
                    <Select 
                      value={editData.priority || issue.priority} 
                      onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') =>
                        setEditData((prev: UpdateIssueInput) => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      value={editData.status || issue.status} 
                      onValueChange={(value: 'open' | 'in_progress' | 'closed' | 'resolved') =>
                        setEditData((prev: UpdateIssueInput) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button onClick={handleUpdateIssue} disabled={isUpdatingIssue} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      {isUpdatingIssue ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge className={getPriorityColor(issue.priority)}>
                      {issue.priority}
                    </Badge>
                    <Badge className={getStatusColor(issue.status)}>
                      {issue.status.replace('_', ' ')}
                    </Badge>
                  </>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditData((prev: UpdateIssueInput) => ({ ...prev, description: e.target.value || null }))
                  }
                  placeholder="Issue description..."
                  rows={6}
                />
              ) : (
                <div className="prose max-w-none">
                  {issue.description ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{issue.description}</p>
                  ) : (
                    <p className="text-gray-500 italic">No description provided</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>💬 Comments ({comments.length})</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment: Comment) => {
                    const commentUser = getCreatedByUser(comment.user_id);
                    return (
                      <div key={comment.id} className="flex space-x-3">
                        <Avatar>
                          <AvatarImage src={commentUser?.avatar_url || undefined} />
                          <AvatarFallback className="bg-blue-100 text-blue-700">
                            {commentUser?.name.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-900">
                                {commentUser?.name || 'Unknown User'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {comment.created_at.toLocaleDateString()} at {comment.created_at.toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Add Comment Form */}
              {currentUser && (
                <>
                  <Separator />
                  <form onSubmit={handleAddComment} className="flex space-x-3">
                    <Avatar>
                      <AvatarImage src={currentUser.avatar_url || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        value={newComment}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows={3}
                        className="mb-2"
                      />
                      <Button 
                        type="submit" 
                        disabled={isSubmittingComment || !newComment.trim()}
                        size="sm"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Issue Info */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">📋 Issue Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Assignee</label>
                {isEditing ? (
                  <Select 
                    value={editData.assigned_to?.toString() || 'unassigned'} 
                    onValueChange={(value: string) =>
                      setEditData((prev: UpdateIssueInput) => ({ 
                        ...prev, 
                        assigned_to: value === 'unassigned' ? null : parseInt(value) 
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users.map((user: UserType) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1 flex items-center space-x-2">
                    {assignedUser ? (
                      <>
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={assignedUser.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {assignedUser.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-gray-900">{assignedUser.name}</span>
                      </>
                    ) : (
                      <span className="text-gray-500">Unassigned</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Created by</label>
                <div className="mt-1 flex items-center space-x-2">
                  {createdByUser && (
                    <>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={createdByUser.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {createdByUser.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-gray-900">{createdByUser.name}</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Due Date</label>
                <div className="mt-1 flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900">
                    {issue.due_date ? issue.due_date.toLocaleDateString() : 'No due date'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Created</label>
                <div className="mt-1 text-gray-900">
                  {issue.created_at.toLocaleDateString()} at {issue.created_at.toLocaleTimeString()}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Last Updated</label>
                <div className="mt-1 text-gray-900">
                  {issue.updated_at.toLocaleDateString()} at {issue.updated_at.toLocaleTimeString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Paperclip className="h-5 w-5" />
                <span>📎 Attachments ({attachments.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <p className="text-gray-500 text-sm">No attachments</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((attachment: Attachment) => (
                    <div key={attachment.id} className="flex items-center space-x-2 text-sm">
                      <Paperclip className="h-4 w-4 text-gray-500" />
                      <a 
                        href={attachment.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {attachment.filename}
                      </a>
                      <span className="text-gray-500">
                        ({Math.round(attachment.file_size / 1024)} KB)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
