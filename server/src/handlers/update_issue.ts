
import { db } from '../db';
import { issuesTable, projectMembersTable } from '../db/schema';
import { type UpdateIssueInput, type Issue } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function updateIssue(input: UpdateIssueInput): Promise<Issue> {
  try {
    // First, get the current issue to check if it exists and get project_id
    const existingIssues = await db.select()
      .from(issuesTable)
      .where(eq(issuesTable.id, input.id))
      .execute();

    if (existingIssues.length === 0) {
      throw new Error('Issue not found');
    }

    const existingIssue = existingIssues[0];

    // If assigned_to is being changed, validate that the new assignee is a project member
    if (input.assigned_to !== undefined && input.assigned_to !== null) {
      const projectMembers = await db.select()
        .from(projectMembersTable)
        .where(and(
          eq(projectMembersTable.project_id, existingIssue.project_id),
          eq(projectMembersTable.user_id, input.assigned_to)
        ))
        .execute();

      if (projectMembers.length === 0) {
        throw new Error('Assigned user is not a member of this project');
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.priority !== undefined) {
      updateData.priority = input.priority;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.assigned_to !== undefined) {
      updateData.assigned_to = input.assigned_to;
    }
    if (input.due_date !== undefined) {
      updateData.due_date = input.due_date;
    }

    // Update the issue
    const result = await db.update(issuesTable)
      .set(updateData)
      .where(eq(issuesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Issue update failed:', error);
    throw error;
  }
}
