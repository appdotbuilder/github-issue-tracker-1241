
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { UserPlus, X, Github, Mail, Calendar } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User, CreateUserInput } from '../../../server/src/schema';

interface UserManagementProps {
  users: User[];
  onUserCreated: (user: User) => void;
}

export function UserManagement({ users, onUserCreated }: UserManagementProps) {
  const [showUserForm, setShowUserForm] = useState(false);
  const [formData, setFormData] = useState<CreateUserInput>({
    email: '',
    name: '',
    github_username: null,
    avatar_url: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await trpc.createUser.mutate(formData);
      onUserCreated(user);
      setShowUserForm(false);
      setFormData({
        email: '',
        name: '',
        github_username: null,
        avatar_url: null
      });
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">👤 User Management</h2>
          <p className="text-gray-600">Manage system users and their access</p>
        </div>
        <Button 
          onClick={() => setShowUserForm(!showUserForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* User Form */}
      {showUserForm && (
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span>✨ Add New User</span>
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowUserForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserInput) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="github_username">GitHub Username</Label>
                  <Input
                    id="github_username"
                    placeholder="johndoe"
                    value={formData.github_username || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserInput) => ({
                        ...prev,
                        github_username: e.target.value || null
                      }))
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="avatar_url">Avatar URL</Label>
                  <Input
                    id="avatar_url"
                    type="url"
                    placeholder="https://avatars.githubusercontent.com/..."
                    value={formData.avatar_url || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserInput) => ({
                        ...prev,
                        avatar_url: e.target.value || null
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowUserForm(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Creating...' : '🎉 Create User'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Users List */}
      {users.length === 0 ? (
        <Card className="text-center py-12 bg-white/80 backdrop-blur-sm">
          <CardContent>
            <UserPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No users yet</h3>
            <p className="text-gray-500 mb-4">
              Add the first user to start collaborating on projects
            </p>
            <Button 
              onClick={() => setShowUserForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add First User
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user: User) => (
            <Card key={user.id} className="bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xl">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-lg truncate">
                      {user.name}
                    </h3>
                    
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      
                      {user.github_username && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Github className="h-3 w-3" />
                          <span className="truncate">@{user.github_username}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>Joined {user.created_at.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      User ID: {user.id}
                    </Badge>
                    
                    {user.github_username ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        GitHub Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600">
                        No GitHub
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
