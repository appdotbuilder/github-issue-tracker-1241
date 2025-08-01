
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, issuesTable } from '../db/schema';
import { type CreateUserInput, type CreateProjectInput, type CreateIssueInput } from '../schema';
import { getIssue } from '../handlers/get_issue';

describe('getIssue', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent issue', async () => {
    const result = await getIssue(999);
    expect(result).toBeNull();
  });

  it('should return issue by ID', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        github_username: 'testuser',
        avatar_url: null
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        github_repo_url: 'https://github.com/test/repo',
        github_repo_name: 'repo',
        github_owner: 'test',
        created_by: userId
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    // Create issue
    const dueDate = new Date('2024-12-31');
    const issueResult = await db.insert(issuesTable)
      .values({
        project_id: projectId,
        title: 'Test Issue',
        description: 'A test issue',
        priority: 'high',
        status: 'open',
        assigned_to: userId,
        created_by: userId,
        due_date: dueDate
      })
      .returning()
      .execute();
    const issueId = issueResult[0].id;

    const result = await getIssue(issueId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(issueId);
    expect(result!.project_id).toEqual(projectId);
    expect(result!.title).toEqual('Test Issue');
    expect(result!.description).toEqual('A test issue');
    expect(result!.priority).toEqual('high');
    expect(result!.status).toEqual('open');
    expect(result!.assigned_to).toEqual(userId);
    expect(result!.created_by).toEqual(userId);
    expect(result!.due_date).toBeInstanceOf(Date);
    expect(result!.due_date!.toISOString()).toEqual(dueDate.toISOString());
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle issue with null fields', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        github_username: null,
        avatar_url: null
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: null,
        github_repo_url: 'https://github.com/test/repo',
        github_repo_name: 'repo',
        github_owner: 'test',
        created_by: userId
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    // Create issue with null optional fields
    const issueResult = await db.insert(issuesTable)
      .values({
        project_id: projectId,
        title: 'Minimal Issue',
        description: null,
        priority: 'low',
        status: 'open',
        assigned_to: null,
        created_by: userId,
        due_date: null
      })
      .returning()
      .execute();
    const issueId = issueResult[0].id;

    const result = await getIssue(issueId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(issueId);
    expect(result!.title).toEqual('Minimal Issue');
    expect(result!.description).toBeNull();
    expect(result!.assigned_to).toBeNull();
    expect(result!.due_date).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return different issues for different IDs', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        github_username: 'testuser',
        avatar_url: null
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        github_repo_url: 'https://github.com/test/repo',
        github_repo_name: 'repo',
        github_owner: 'test',
        created_by: userId
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    // Create first issue
    const issue1Result = await db.insert(issuesTable)
      .values({
        project_id: projectId,
        title: 'First Issue',
        description: 'First test issue',
        priority: 'high',
        status: 'open',
        assigned_to: userId,
        created_by: userId,
        due_date: null
      })
      .returning()
      .execute();
    const issue1Id = issue1Result[0].id;

    // Create second issue
    const issue2Result = await db.insert(issuesTable)
      .values({
        project_id: projectId,
        title: 'Second Issue',
        description: 'Second test issue',
        priority: 'low',
        status: 'in_progress',
        assigned_to: null,
        created_by: userId,
        due_date: null
      })
      .returning()
      .execute();
    const issue2Id = issue2Result[0].id;

    const result1 = await getIssue(issue1Id);
    const result2 = await getIssue(issue2Id);

    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();
    expect(result1!.id).toEqual(issue1Id);
    expect(result2!.id).toEqual(issue2Id);
    expect(result1!.title).toEqual('First Issue');
    expect(result2!.title).toEqual('Second Issue');
    expect(result1!.priority).toEqual('high');
    expect(result2!.priority).toEqual('low');
    expect(result1!.status).toEqual('open');
    expect(result2!.status).toEqual('in_progress');
  });
});
