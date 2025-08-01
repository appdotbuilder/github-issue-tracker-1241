
import { db } from '../db';
import { projectsTable, projectMembersTable } from '../db/schema';
import { type CreateProjectInput, type Project } from '../schema';

export const createProject = async (input: CreateProjectInput): Promise<Project> => {
  try {
    // Start a transaction to ensure both project and membership are created together
    const result = await db.transaction(async (tx) => {
      // Insert project record
      const projectResult = await tx.insert(projectsTable)
        .values({
          name: input.name,
          description: input.description,
          github_repo_url: input.github_repo_url,
          github_repo_name: input.github_repo_name,
          github_owner: input.github_owner,
          created_by: input.created_by
        })
        .returning()
        .execute();

      const project = projectResult[0];

      // Automatically add the creator as a project member with edit role
      await tx.insert(projectMembersTable)
        .values({
          project_id: project.id,
          user_id: input.created_by,
          role: 'edit'
        })
        .execute();

      return project;
    });

    return result;
  } catch (error) {
    console.error('Project creation failed:', error);
    throw error;
  }
};
