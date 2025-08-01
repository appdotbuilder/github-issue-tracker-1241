
import { db } from '../db';
import { projectsTable, projectMembersTable } from '../db/schema';
import { type Project } from '../schema';
import { eq, or } from 'drizzle-orm';

export async function getUserProjects(userId: number): Promise<Project[]> {
  try {
    // Get projects where user is either the creator OR a member
    const results = await db.select({
      id: projectsTable.id,
      name: projectsTable.name,
      description: projectsTable.description,
      github_repo_url: projectsTable.github_repo_url,
      github_repo_name: projectsTable.github_repo_name,
      github_owner: projectsTable.github_owner,
      created_by: projectsTable.created_by,
      created_at: projectsTable.created_at,
    })
    .from(projectsTable)
    .leftJoin(projectMembersTable, eq(projectsTable.id, projectMembersTable.project_id))
    .where(
      or(
        eq(projectsTable.created_by, userId),
        eq(projectMembersTable.user_id, userId)
      )
    )
    .execute();

    // Remove duplicates by project id (a user might be both creator and member)
    const uniqueProjects = new Map<number, Project>();
    
    results.forEach(result => {
      if (!uniqueProjects.has(result.id)) {
        uniqueProjects.set(result.id, {
          id: result.id,
          name: result.name,
          description: result.description,
          github_repo_url: result.github_repo_url,
          github_repo_name: result.github_repo_name,
          github_owner: result.github_owner,
          created_by: result.created_by,
          created_at: result.created_at,
        });
      }
    });

    return Array.from(uniqueProjects.values());
  } catch (error) {
    console.error('Failed to get user projects:', error);
    throw error;
  }
}
