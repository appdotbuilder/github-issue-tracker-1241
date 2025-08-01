
import { db } from '../db';
import { issuesTable } from '../db/schema';
import { type Issue, type IssueStatus, type IssuePriority } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export interface GetProjectIssuesFilters {
  status?: IssueStatus;
  priority?: IssuePriority;
  assigned_to?: number;
}

export async function getProjectIssues(
  projectId: number, 
  filters?: GetProjectIssuesFilters
): Promise<Issue[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [
      eq(issuesTable.project_id, projectId)
    ];

    // Apply filters if provided
    if (filters?.status) {
      conditions.push(eq(issuesTable.status, filters.status));
    }

    if (filters?.priority) {
      conditions.push(eq(issuesTable.priority, filters.priority));
    }

    if (filters?.assigned_to !== undefined) {
      conditions.push(eq(issuesTable.assigned_to, filters.assigned_to));
    }

    // Execute query with all conditions
    const results = await db.select()
      .from(issuesTable)
      .where(and(...conditions))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch project issues:', error);
    throw error;
  }
}
