
import { db } from '../db';
import { commentsTable, usersTable } from '../db/schema';
import { type Comment } from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function getIssueComments(issueId: number): Promise<Comment[]> {
  try {
    // Join comments with users to get author information
    const results = await db.select({
      id: commentsTable.id,
      issue_id: commentsTable.issue_id,
      user_id: commentsTable.user_id,
      content: commentsTable.content,
      created_at: commentsTable.created_at,
      updated_at: commentsTable.updated_at,
      // Include user information
      user_name: usersTable.name,
      user_email: usersTable.email,
      user_avatar_url: usersTable.avatar_url
    })
    .from(commentsTable)
    .innerJoin(usersTable, eq(commentsTable.user_id, usersTable.id))
    .where(eq(commentsTable.issue_id, issueId))
    .orderBy(asc(commentsTable.created_at))
    .execute();

    // Map results to Comment type (excluding user info as it's not part of the Comment schema)
    return results.map(result => ({
      id: result.id,
      issue_id: result.issue_id,
      user_id: result.user_id,
      content: result.content,
      created_at: result.created_at,
      updated_at: result.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch issue comments:', error);
    throw error;
  }
}
