
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, Shield, Eye } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Project, User, ProjectMember, InviteUserToProjectInput } from '../../../server/src/schema';

interface ProjectMembersProps {
  project: Project;
  users: User[];
  currentUser: User | null;
}

export function ProjectMembers({ project, users, currentUser }: ProjectMembersProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'view' | 'edit'>('view');
  const [isInviting, setIsInviting] = useState(false);

  const loadMembers = useCallback(async () => {
    try {
      const result = await trpc.getProjectMembers.query({ projectId: project.id });
      setMembers(result);
    } catch (error) {
      console.error('Failed to load project members:', error);
    }
  }, [project.id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleInviteUser = async () => {
    if (!selectedUser || !currentUser) return;

    setIsInviting(true);
    try {
      const inviteData: InviteUserToProjectInput = {
        project_id: project.id,
        user_id: parseInt(selectedUser),
        role: selectedRole
      };
      await trpc.inviteUserToProject.mutate(inviteData);
      setShowInviteForm(false);
      setSelectedUser('');
      setSelectedRole('view');
      loadMembers();
    } catch (error) {
      console.error('Failed to invite user:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const getMemberUser = (userId: number) => {
    return users.find((user: User) => user.id === userId);
  };

  const getAvailableUsers = () => {
    const memberUserIds = members.map((member: ProjectMember) => member.user_id);
    return users.filter((user: User) => !memberUserIds.includes(user.id));
  };

  const getRoleIcon = (role: string) => {
    return role === 'edit' ? (
      <Shield className="h-4 w-4 text-blue-600" />
    ) : (
      <Eye className="h-4 w-4 text-gray-600" />
    );
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'edit' 
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const availableUsers = getAvailableUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">👥 Project Members</h2>
          <p className="text-gray-600">{project.name}</p>
        </div>
        {availableUsers.length > 0 && (
          <Button 
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>✨ Invite User to Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Select User</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user to invite" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user: User) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Role</label>
                <Select value={selectedRole} onValueChange={(value: 'view' | 'edit') => setSelectedRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4" />
                        <span>View Only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="edit">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>Edit Access</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowInviteForm(false);
                  setSelectedUser('');
                  setSelectedRole('view');
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleInviteUser}
                disabled={!selectedUser || isInviting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isInviting ? 'Inviting...' : '🎉 Send Invitation'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      {members.length === 0 ? (
        <Card className="text-center py-12 bg-white/80 backdrop-blur-sm">
          <CardContent>
            <UserPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No members yet</h3>
            <p className="text-gray-500 mb-4">
              Start collaborating by inviting team members to this project
            </p>
            {availableUsers.length > 0 && (
              <Button 
                onClick={() => setShowInviteForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite First Member
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member: ProjectMember) => {
            const user = getMemberUser(member.user_id);
            if (!user) return null;

            return (
              <Card key={member.id} className="bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {user.name}
                        </h3>
                        {currentUser?.id === user.id && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{user.email}</p>
                      {user.github_username && (
                        <p className="text-xs text-gray-500">@{user.github_username}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <Badge className={getRoleBadgeColor(member.role)}>
                      <div className="flex items-center space-x-1">
                        {getRoleIcon(member.role)}
                        <span className="capitalize">{member.role}</span>
                      </div>
                    </Badge>
                    
                    <div className="text-xs text-gray-500">
                      Joined {member.invited_at.toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {availableUsers.length === 0 && members.length > 0 && (
        <Card className="bg-blue-50/80 backdrop-blur-sm border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <UserPlus className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-blue-900 mb-2">All users have been invited! 🎉</h3>
              <p className="text-blue-700 text-sm">
                Create new users in the Users tab to invite more people to this project.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
