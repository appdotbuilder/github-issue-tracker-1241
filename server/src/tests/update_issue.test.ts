
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, projectMembersTable, issuesTable } from '../db/schema';
import { type UpdateIssueInput } from '../schema';
import { updateIssue } from '../handlers/update_issue';
import { eq } from 'drizzle-orm';

describe('updateIssue', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testProjectId: number;
  let testIssueId: number;
  let assigneeUserId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create assignee user
    const assigneeResult = await db.insert(usersTable)
      .values({
        email: 'assignee@example.com',
        name: 'Assignee User'
      })
      .returning()
      .execute();
    assigneeUserId = assigneeResult[0].id;

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        github_repo_url: 'https://github.com/test/repo',
        github_repo_name: 'repo',
        github_owner: 'test',
        created_by: testUserId
      })
      .returning()
      .execute();
    testProjectId = projectResult[0].id;

    // Add assignee to project members
    await db.insert(projectMembersTable)
      .values({
        project_id: testProjectId,
        user_id: assigneeUserId,
        role: 'edit'
      })
      .execute();

    // Create test issue
    const issueResult = await db.insert(issuesTable)
      .values({
        project_id: testProjectId,
        title: 'Original Title',
        description: 'Original description',
        priority: 'medium',
        status: 'open',
        created_by: testUserId
      })
      .returning()
      .execute();
    testIssueId = issueResult[0].id;
  });

  it('should update issue title', async () => {
    const input: UpdateIssueInput = {
      id: testIssueId,
      title: 'Updated Title'
    };

    const result = await updateIssue(input);

    expect(result.id).toBe(testIssueId);
    expect(result.title).toBe('Updated Title');
    expect(result.description).toBe('Original description'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update issue description', async () => {
    const input: UpdateIssueInput = {
      id: testIssueId,
      description: 'Updated description'
    };

    const result = await updateIssue(input);

    expect(result.description).toBe('Updated description');
    expect(result.title).toBe('Original Title'); // Should remain unchanged
  });

  it('should update issue priority and status', async () => {
    const input: UpdateIssueInput = {
      id: testIssueId,
      priority: 'high',
      status: 'in_progress'
    };

    const result = await updateIssue(input);

    expect(result.priority).toBe('high');
    expect(result.status).toBe('in_progress');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update assigned_to with valid project member', async () => {
    const input: UpdateIssueInput = {
      id: testIssueId,
      assigned_to: assigneeUserId
    };

    const result = await updateIssue(input);

    expect(result.assigned_to).toBe(assigneeUserId);
  });

  it('should update due_date', async () => {
    const dueDate = new Date('2024-12-31');
    const input: UpdateIssueInput = {
      id: testIssueId,
      due_date: dueDate
    };

    const result = await updateIssue(input);

    expect(result.due_date).toEqual(dueDate);
  });

  it('should update multiple fields at once', async () => {
    const dueDate = new Date('2024-12-31');
    const input: UpdateIssueInput = {
      id: testIssueId,
      title: 'Multi Update Title',
      priority: 'critical',
      status: 'resolved',
      assigned_to: assigneeUserId,
      due_date: dueDate
    };

    const result = await updateIssue(input);

    expect(result.title).toBe('Multi Update Title');
    expect(result.priority).toBe('critical');
    expect(result.status).toBe('resolved');
    expect(result.assigned_to).toBe(assigneeUserId);
    expect(result.due_date).toEqual(dueDate);
  });

  it('should save changes to database', async () => {
    const input: UpdateIssueInput = {
      id: testIssueId,
      title: 'DB Update Test'
    };

    await updateIssue(input);

    // Verify changes were saved
    const issues = await db.select()
      .from(issuesTable)
      .where(eq(issuesTable.id, testIssueId))
      .execute();

    expect(issues).toHaveLength(1);
    expect(issues[0].title).toBe('DB Update Test');
    expect(issues[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent issue', async () => {
    const input: UpdateIssueInput = {
      id: 99999,
      title: 'Non-existent Issue'
    };

    await expect(updateIssue(input)).rejects.toThrow(/issue not found/i);
  });

  it('should throw error when assigning to non-project member', async () => {
    // Create user who is not a project member
    const nonMemberResult = await db.insert(usersTable)
      .values({
        email: 'nonmember@example.com',
        name: 'Non Member'
      })
      .returning()
      .execute();

    const input: UpdateIssueInput = {
      id: testIssueId,
      assigned_to: nonMemberResult[0].id
    };

    await expect(updateIssue(input)).rejects.toThrow(/not a member of this project/i);
  });

  it('should allow setting assigned_to to null', async () => {
    // First assign to someone
    await updateIssue({
      id: testIssueId,
      assigned_to: assigneeUserId
    });

    // Then unassign
    const input: UpdateIssueInput = {
      id: testIssueId,
      assigned_to: null
    };

    const result = await updateIssue(input);

    expect(result.assigned_to).toBe(null);
  });
});
