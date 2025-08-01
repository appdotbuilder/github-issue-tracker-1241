
import { db } from '../db';
import { commentsTable, issuesTable, projectsTable, projectMembersTable } from '../db/schema';
import { type CreateCommentInput, type Comment } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function createComment(input: CreateCommentInput): Promise<Comment> {
  try {
    // First, verify that the user has access to the project containing the issue
    const issueWithProject = await db.select({
      issue_id: issuesTable.id,
      project_id: issuesTable.project_id,
      project_created_by: projectsTable.created_by
    })
    .from(issuesTable)
    .innerJoin(projectsTable, eq(issuesTable.project_id, projectsTable.id))
    .where(eq(issuesTable.id, input.issue_id))
    .execute();

    if (issueWithProject.length === 0) {
      throw new Error('Issue not found');
    }

    const { project_id, project_created_by } = issueWithProject[0];

    // Check if user has access to the project (either as creator or member)
    const hasAccess = project_created_by === input.user_id;
    
    if (!hasAccess) {
      // Check if user is a project member
      const membership = await db.select()
        .from(projectMembersTable)
        .where(and(
          eq(projectMembersTable.project_id, project_id),
          eq(projectMembersTable.user_id, input.user_id)
        ))
        .execute();

      if (membership.length === 0) {
        throw new Error('User does not have access to this project');
      }
    }

    // Create the comment
    const result = await db.insert(commentsTable)
      .values({
        issue_id: input.issue_id,
        user_id: input.user_id,
        content: input.content
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Comment creation failed:', error);
    throw error;
  }
}
