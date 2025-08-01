
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Users, Bug, Calendar, AlertCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { ProjectForm } from '@/components/ProjectForm';
import { IssueBoard } from '@/components/IssueBoard';
import { ProjectMembers } from '@/components/ProjectMembers';
import { UserManagement } from '@/components/UserManagement';
import type { User, Project, Issue } from '../../server/src/schema';

function App() {
  const [activeTab, setActiveTab] = useState('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectIssues, setProjectIssues] = useState<Issue[]>([]);
  
  // UI state
  const [showProjectForm, setShowProjectForm] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.getUsers.query();
      setUsers(result);
      // Set first user as current user for demo purposes
      if (result.length > 0 && !currentUser) {
        setCurrentUser(result[0]);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, [currentUser]);

  const loadProjects = useCallback(async () => {
    try {
      const result = await trpc.getProjects.query();
      setProjects(result);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }, []);

  const loadProjectIssues = useCallback(async (projectId: number) => {
    try {
      const result = await trpc.getProjectIssues.query({ projectId });
      setProjectIssues(result);
    } catch (error) {
      console.error('Failed to load project issues:', error);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadProjects();
  }, [loadUsers, loadProjects]);

  useEffect(() => {
    if (selectedProject) {
      loadProjectIssues(selectedProject.id);
    }
  }, [selectedProject, loadProjectIssues]);

  const handleProjectCreated = (project: Project) => {
    setProjects((prev: Project[]) => [...prev, project]);
    setShowProjectForm(false);
    setSelectedProject(project);
    setActiveTab('issues');
  };

  const handleUserCreated = (user: User) => {
    setUsers((prev: User[]) => [...prev, user]);
  };

  const handleIssueUpdated = () => {
    if (selectedProject) {
      loadProjectIssues(selectedProject.id);
    }
  };

  const getProjectStats = (project: Project) => {
    const issues = projectIssues.filter((issue: Issue) => issue.project_id === project.id);
    const openIssues = issues.filter((issue: Issue) => issue.status === 'open').length;
    const inProgressIssues = issues.filter((issue: Issue) => issue.status === 'in_progress').length;
    const criticalIssues = issues.filter((issue: Issue) => issue.priority === 'critical').length;
    
    return { total: issues.length, open: openIssues, inProgress: inProgressIssues, critical: criticalIssues };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Bug className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🐛 BugTracker</h1>
              <p className="text-gray-600">Manage projects and track issues efficiently</p>
            </div>
          </div>
          
          {currentUser && (
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={currentUser.avatar_url || undefined} />
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {currentUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{currentUser.name}</p>
                <p className="text-sm text-gray-600">{currentUser.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="projects" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Projects</span>
            </TabsTrigger>
            <TabsTrigger value="issues" disabled={!selectedProject} className="flex items-center space-x-2">
              <Bug className="h-4 w-4" />
              <span>Issues</span>
            </TabsTrigger>
            <TabsTrigger value="members" disabled={!selectedProject} className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Members</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">📚 Projects</h2>
              <Button 
                onClick={() => setShowProjectForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>

            {showProjectForm && (
              <ProjectForm
                currentUser={currentUser}
                onSubmit={handleProjectCreated}
                onCancel={() => setShowProjectForm(false)}
              />
            )}

            {projects.length === 0 ? (
              <Card className="text-center py-12 bg-white/80 backdrop-blur-sm">
                <CardContent>
                  <Bug className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No projects yet</h3>
                  <p className="text-gray-500 mb-4">
                    Create your first project by importing a GitHub repository
                  </p>
                  <Button 
                    onClick={() => setShowProjectForm(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project: Project) => {
                  const stats = getProjectStats(project);
                  return (
                    <Card 
                      key={project.id} 
                      className={`cursor-pointer transition-all hover:shadow-lg bg-white/80 backdrop-blur-sm border-2 ${
                        selectedProject?.id === project.id ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedProject(project)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-xl font-bold text-gray-900">
                            {project.name}
                          </CardTitle>
                          {stats.critical > 0 && (
                            <Badge variant="destructive" className="flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {stats.critical}
                            </Badge>
                          )}
                        </div>
                        {project.description && (
                          <p className="text-gray-600 text-sm">{project.description}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium">GitHub:</span>
                            <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
                              {project.github_owner}/{project.github_repo_name}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-blue-50 rounded-lg p-2">
                              <div className="font-bold text-blue-700">{stats.total}</div>
                              <div className="text-xs text-blue-600">Total</div>
                            </div>
                            <div className="bg-yellow-50 rounded-lg p-2">
                              <div className="font-bold text-yellow-700">{stats.open}</div>
                              <div className="text-xs text-yellow-600">Open</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-2">
                              <div className="font-bold text-green-700">{stats.inProgress}</div>
                              <div className="text-xs text-green-600">In Progress</div>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500 pt-2 border-t">
                            Created {project.created_at.toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Issues Tab */}
          <TabsContent value="issues" className="space-y-6">
            {selectedProject ? (
              <IssueBoard 
                project={selectedProject}
                issues={projectIssues}
                users={users}
                currentUser={currentUser}
                onIssueUpdated={handleIssueUpdated}
              />
            ) : (
              <Card className="text-center py-12 bg-white/80 backdrop-blur-sm">
                <CardContent>
                  <Bug className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a project</h3>
                  <p className="text-gray-500">Choose a project from the Projects tab to view its issues</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            {selectedProject ? (
              <ProjectMembers 
                project={selectedProject}
                users={users}
                currentUser={currentUser}
              />
            ) : (
              <Card className="text-center py-12 bg-white/80 backdrop-blur-sm">
                <CardContent>
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a project</h3>
                  <p className="text-gray-500">Choose a project to manage its members</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <UserManagement 
              users={users}
              onUserCreated={handleUserCreated}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
