
import { db } from '../db';
import { issuesTable } from '../db/schema';
import { type Issue } from '../schema';
import { eq } from 'drizzle-orm';

export async function getIssue(issueId: number): Promise<Issue | null> {
  try {
    const results = await db.select()
      .from(issuesTable)
      .where(eq(issuesTable.id, issueId))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const issue = results[0];
    return {
      ...issue,
      // All timestamp fields are already Date objects from drizzle
      // No conversion needed for created_at, updated_at, due_date
    };
  } catch (error) {
    console.error('Failed to get issue:', error);
    throw error;
  }
}
