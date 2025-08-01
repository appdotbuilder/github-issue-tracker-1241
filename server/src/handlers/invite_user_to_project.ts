
import { db } from '../db';
import { projectMembersTable, projectsTable, usersTable } from '../db/schema';
import { type InviteUserToProjectInput, type ProjectMember } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function inviteUserToProject(input: InviteUserToProjectInput): Promise<ProjectMember> {
  try {
    // Verify that the project exists
    const project = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, input.project_id))
      .execute();

    if (project.length === 0) {
      throw new Error('Project not found');
    }

    // Verify that the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Check if user is already a member of this project
    const existingMembership = await db.select()
      .from(projectMembersTable)
      .where(and(
        eq(projectMembersTable.project_id, input.project_id),
        eq(projectMembersTable.user_id, input.user_id)
      ))
      .execute();

    if (existingMembership.length > 0) {
      throw new Error('User is already a member of this project');
    }

    // Create the project membership
    const result = await db.insert(projectMembersTable)
      .values({
        project_id: input.project_id,
        user_id: input.user_id,
        role: input.role
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Project invitation failed:', error);
    throw error;
  }
}
