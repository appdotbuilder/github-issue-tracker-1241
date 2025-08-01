
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Github, X } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User, Project, CreateProjectInput } from '../../../server/src/schema';

interface ProjectFormProps {
  currentUser: User | null;
  onSubmit: (project: Project) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProjectForm({ currentUser, onSubmit, onCancel, isLoading = false }: ProjectFormProps) {
  const [formData, setFormData] = useState<CreateProjectInput>({
    name: '',
    description: null,
    github_repo_url: '',
    github_repo_name: '',
    github_owner: '',
    created_by: currentUser?.id || 0
  });

  const [submitting, setSubmitting] = useState(false);

  const handleGitHubUrlChange = (url: string) => {
    setFormData((prev: CreateProjectInput) => ({ ...prev, github_repo_url: url }));
    
    // Auto-parse GitHub URL
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      const [, owner, repo] = match;
      setFormData((prev: CreateProjectInput) => ({
        ...prev,
        github_owner: owner,
        github_repo_name: repo.replace(/\.git$/, ''),
        name: prev.name || repo.replace(/\.git$/, '')
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSubmitting(true);
    try {
      const project = await trpc.createProject.mutate(formData);
      onSubmit(project);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Github className="h-5 w-5" />
            <span>🚀 Create New Project</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="github_repo_url">GitHub Repository URL *</Label>
            <Input
              id="github_repo_url"
              type="url"
              placeholder="https://github.com/username/repository"
              value={formData.github_repo_url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleGitHubUrlChange(e.target.value)
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="github_owner">Repository Owner</Label>
              <Input
                id="github_owner"
                placeholder="username"
                value={formData.github_owner}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateProjectInput) => ({ ...prev, github_owner: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="github_repo_name">Repository Name</Label>
              <Input
                id="github_repo_name"
                placeholder="repository-name"
                value={formData.github_repo_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateProjectInput) => ({ ...prev, github_repo_name: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              placeholder="My Awesome Project"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateProjectInput) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of your project..."
              value={formData.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateProjectInput) => ({
                  ...prev,
                  description: e.target.value || null
                }))
              }
              rows={3}
            />
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
            {submitting ? 'Creating...' : '✨ Create Project'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
