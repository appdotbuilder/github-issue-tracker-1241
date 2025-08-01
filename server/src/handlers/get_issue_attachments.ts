
import { db } from '../db';
import { attachmentsTable, usersTable } from '../db/schema';
import { type Attachment } from '../schema';
import { eq } from 'drizzle-orm';

export async function getIssueAttachments(issueId: number): Promise<Attachment[]> {
  try {
    const results = await db.select()
      .from(attachmentsTable)
      .innerJoin(usersTable, eq(attachmentsTable.uploaded_by, usersTable.id))
      .where(eq(attachmentsTable.issue_id, issueId))
      .execute();

    return results.map(result => ({
      id: result.attachments.id,
      issue_id: result.attachments.issue_id,
      filename: result.attachments.filename,
      file_url: result.attachments.file_url,
      file_size: result.attachments.file_size,
      mime_type: result.attachments.mime_type,
      uploaded_by: result.attachments.uploaded_by,
      uploaded_at: result.attachments.uploaded_at
    }));
  } catch (error) {
    console.error('Failed to get issue attachments:', error);
    throw error;
  }
}
