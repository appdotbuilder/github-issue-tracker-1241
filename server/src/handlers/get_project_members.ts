
import { db } from '../db';
import { projectMembersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type ProjectMember } from '../schema';

export async function getProjectMembers(projectId: number): Promise<ProjectMember[]> {
  try {
    const results = await db.select()
      .from(projectMembersTable)
      .where(eq(projectMembersTable.project_id, projectId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get project members:', error);
    throw error;
  }
}
