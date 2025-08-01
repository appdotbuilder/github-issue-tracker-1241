
import { db } from '../db';
import { issuesTable, projectsTable, projectMembersTable, usersTable } from '../db/schema';
import { type CreateIssueInput, type Issue } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createIssue = async (input: CreateIssueInput): Promise<Issue> => {
  try {
    // Validate that the project exists and creator has access
    const projectAccess = await db.select()
      .from(projectsTable)
      .leftJoin(
        projectMembersTable,
        and(
          eq(projectMembersTable.project_id, projectsTable.id),
          eq(projectMembersTable.user_id, input.created_by)
        )
      )
      .where(eq(projectsTable.id, input.project_id))
      .execute();

    if (projectAccess.length === 0) {
      throw new Error('Project not found');
    }

    const project = projectAccess[0].projects;
    const membership = projectAccess[0].project_members;

    // Check if user has access (either creator or member)
    const hasAccess = project.created_by === input.created_by || membership !== null;
    if (!hasAccess) {
      throw new Error('User does not have access to this project');
    }

    // If assigned_to is provided, validate the assignee is a project member
    if (input.assigned_to) {
      const assigneeAccess = await db.select()
        .from(projectsTable)
        .leftJoin(
          projectMembersTable,
          and(
            eq(projectMembersTable.project_id, projectsTable.id),
            eq(projectMembersTable.user_id, input.assigned_to)
          )
        )
        .where(eq(projectsTable.id, input.project_id))
        .execute();

      const assigneeMembership = assigneeAccess[0]?.project_members;
      const isCreator = project.created_by === input.assigned_to;
      
      if (!isCreator && !assigneeMembership) {
        throw new Error('Assigned user is not a member of this project');
      }
    }

    // Create the issue
    const result = await db.insert(issuesTable)
      .values({
        project_id: input.project_id,
        title: input.title,
        description: input.description || null,
        priority: input.priority,
        status: input.status || 'open',
        assigned_to: input.assigned_to || null,
        created_by: input.created_by,
        due_date: input.due_date || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Issue creation failed:', error);
    throw error;
  }
};
