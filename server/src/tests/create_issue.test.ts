
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, projectMembersTable, issuesTable } from '../db/schema';
import { type CreateIssueInput } from '../schema';
import { createIssue } from '../handlers/create_issue';
import { eq } from 'drizzle-orm';

describe('createIssue', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUser: any;
  let testProject: any;
  let testMember: any;

  beforeEach(async () => {
    // Create test user (project creator)
    const userResult = await db.insert(usersTable)
      .values({
        email: 'creator@test.com',
        name: 'Test Creator',
        github_username: 'testcreator',
        avatar_url: null
      })
      .returning()
      .execute();
    testUser = userResult[0];

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        github_repo_url: 'https://github.com/test/repo',
        github_repo_name: 'repo',
        github_owner: 'test',
        created_by: testUser.id
      })
      .returning()
      .execute();
    testProject = projectResult[0];

    // Create test member user
    const memberResult = await db.insert(usersTable)
      .values({
        email: 'member@test.com',
        name: 'Test Member',
        github_username: 'testmember',
        avatar_url: null
      })
      .returning()
      .execute();
    testMember = memberResult[0];

    // Add member to project
    await db.insert(projectMembersTable)
      .values({
        project_id: testProject.id,
        user_id: testMember.id,
        role: 'edit'
      })
      .execute();
  });

  const testInput: CreateIssueInput = {
    project_id: 0, // Will be set in tests
    title: 'Test Issue',
    description: 'A test issue description',
    priority: 'medium',
    status: 'open',
    assigned_to: null,
    created_by: 0, // Will be set in tests
    due_date: null
  };

  it('should create an issue when creator is project owner', async () => {
    const input = {
      ...testInput,
      project_id: testProject.id,
      created_by: testUser.id
    };

    const result = await createIssue(input);

    expect(result.title).toEqual('Test Issue');
    expect(result.description).toEqual('A test issue description');
    expect(result.priority).toEqual('medium');
    expect(result.status).toEqual('open');
    expect(result.project_id).toEqual(testProject.id);
    expect(result.created_by).toEqual(testUser.id);
    expect(result.assigned_to).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an issue when creator is project member', async () => {
    const input = {
      ...testInput,
      project_id: testProject.id,
      created_by: testMember.id
    };

    const result = await createIssue(input);

    expect(result.title).toEqual('Test Issue');
    expect(result.created_by).toEqual(testMember.id);
    expect(result.project_id).toEqual(testProject.id);
  });

  it('should save issue to database', async () => {
    const input = {
      ...testInput,
      project_id: testProject.id,
      created_by: testUser.id
    };

    const result = await createIssue(input);

    const issues = await db.select()
      .from(issuesTable)
      .where(eq(issuesTable.id, result.id))
      .execute();

    expect(issues).toHaveLength(1);
    expect(issues[0].title).toEqual('Test Issue');
    expect(issues[0].description).toEqual('A test issue description');
    expect(issues[0].priority).toEqual('medium');
    expect(issues[0].status).toEqual('open');
    expect(issues[0].created_at).toBeInstanceOf(Date);
    expect(issues[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create issue with assigned user who is project member', async () => {
    const input = {
      ...testInput,
      project_id: testProject.id,
      created_by: testUser.id,
      assigned_to: testMember.id
    };

    const result = await createIssue(input);

    expect(result.assigned_to).toEqual(testMember.id);
  });

  it('should create issue with assigned user who is project creator', async () => {
    const input = {
      ...testInput,
      project_id: testProject.id,
      created_by: testMember.id,
      assigned_to: testUser.id
    };

    const result = await createIssue(input);

    expect(result.assigned_to).toEqual(testUser.id);
  });

  it('should apply default status when not provided', async () => {
    const input: CreateIssueInput = {
      project_id: testProject.id,
      title: 'Test Issue',
      description: 'A test issue description',
      priority: 'medium',
      status: 'open', // Include required status field
      created_by: testUser.id
    };

    const result = await createIssue(input);

    expect(result.status).toEqual('open');
  });

  it('should throw error when project does not exist', async () => {
    const input = {
      ...testInput,
      project_id: 99999,
      created_by: testUser.id
    };

    expect(createIssue(input)).rejects.toThrow(/project not found/i);
  });

  it('should throw error when user has no access to project', async () => {
    // Create user who is not a member
    const outsiderResult = await db.insert(usersTable)
      .values({
        email: 'outsider@test.com',
        name: 'Outsider',
        github_username: 'outsider',
        avatar_url: null
      })
      .returning()
      .execute();

    const input = {
      ...testInput,
      project_id: testProject.id,
      created_by: outsiderResult[0].id
    };

    expect(createIssue(input)).rejects.toThrow(/does not have access/i);
  });

  it('should throw error when assigned user is not project member', async () => {
    // Create user who is not a member
    const outsiderResult = await db.insert(usersTable)
      .values({
        email: 'outsider@test.com',
        name: 'Outsider',
        github_username: 'outsider',
        avatar_url: null
      })
      .returning()
      .execute();

    const input = {
      ...testInput,
      project_id: testProject.id,
      created_by: testUser.id,
      assigned_to: outsiderResult[0].id
    };

    expect(createIssue(input)).rejects.toThrow(/not a member of this project/i);
  });
});
