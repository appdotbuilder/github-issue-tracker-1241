
import { db } from '../db';
import { attachmentsTable, issuesTable, projectsTable, projectMembersTable } from '../db/schema';
import { type CreateAttachmentInput, type Attachment } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createAttachment = async (input: CreateAttachmentInput): Promise<Attachment> => {
  try {
    // First, verify that the issue exists and get the project_id
    const issueResults = await db.select({
      project_id: issuesTable.project_id
    })
      .from(issuesTable)
      .where(eq(issuesTable.id, input.issue_id))
      .execute();

    if (issueResults.length === 0) {
      throw new Error('Issue not found');
    }

    const projectId = issueResults[0].project_id;

    // Verify that the user has access to the project (either creator or member)
    const projectAccess = await db.select()
      .from(projectsTable)
      .where(
        and(
          eq(projectsTable.id, projectId),
          eq(projectsTable.created_by, input.uploaded_by)
        )
      )
      .execute();

    // If not the project creator, check if they're a member
    if (projectAccess.length === 0) {
      const memberAccess = await db.select()
        .from(projectMembersTable)
        .where(
          and(
            eq(projectMembersTable.project_id, projectId),
            eq(projectMembersTable.user_id, input.uploaded_by)
          )
        )
        .execute();

      if (memberAccess.length === 0) {
        throw new Error('User does not have access to this project');
      }
    }

    // Create the attachment
    const result = await db.insert(attachmentsTable)
      .values({
        issue_id: input.issue_id,
        filename: input.filename,
        file_url: input.file_url,
        file_size: input.file_size,
        mime_type: input.mime_type,
        uploaded_by: input.uploaded_by
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Attachment creation failed:', error);
    throw error;
  }
};
