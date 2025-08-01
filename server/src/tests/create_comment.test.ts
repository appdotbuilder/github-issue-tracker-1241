
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, issuesTable, commentsTable, projectMembersTable } from '../db/schema';
import { type CreateCommentInput } from '../schema';
import { createComment } from '../handlers/create_comment';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  github_username: 'testuser',
  avatar_url: 'https://example.com/avatar.jpg'
};

const testUser2 = {
  email: 'test2@example.com',
  name: 'Test User 2',
  github_username: 'testuser2',
  avatar_url: null
};

const testProject = {
  name: 'Test Project',
  description: 'A test project',
  github_repo_url: 'https://github.com/test/repo',
  github_repo_name: 'repo',
  github_owner: 'test',
  created_by: 1
};

const testIssue = {
  project_id: 1,
  title: 'Test Issue',
  description: 'A test issue',
  priority: 'medium' as const,
  status: 'open' as const,
  assigned_to: null,
  created_by: 1,
  due_date: null
};

const testCommentInput: CreateCommentInput = {
  issue_id: 1,
  user_id: 1,
  content: 'This is a test comment'
};

describe('createComment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a comment when user is project creator', async () => {
    // Create user, project, and issue
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(projectsTable).values(testProject).execute();
    await db.insert(issuesTable).values(testIssue).execute();

    const result = await createComment(testCommentInput);

    // Validate returned comment
    expect(result.id).toBeDefined();
    expect(result.issue_id).toEqual(1);
    expect(result.user_id).toEqual(1);
    expect(result.content).toEqual('This is a test comment');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save comment to database', async () => {
    // Create user, project, and issue
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(projectsTable).values(testProject).execute();
    await db.insert(issuesTable).values(testIssue).execute();

    const result = await createComment(testCommentInput);

    // Query database to verify comment was saved
    const comments = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.id, result.id))
      .execute();

    expect(comments).toHaveLength(1);
    expect(comments[0].issue_id).toEqual(1);
    expect(comments[0].user_id).toEqual(1);
    expect(comments[0].content).toEqual('This is a test comment');
    expect(comments[0].created_at).toBeInstanceOf(Date);
    expect(comments[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create a comment when user is project member', async () => {
    // Create users, project, and issue
    await db.insert(usersTable).values([testUser, testUser2]).execute();
    await db.insert(projectsTable).values(testProject).execute();
    await db.insert(issuesTable).values(testIssue).execute();

    // Add user2 as project member
    await db.insert(projectMembersTable).values({
      project_id: 1,
      user_id: 2,
      role: 'edit'
    }).execute();

    const memberCommentInput: CreateCommentInput = {
      issue_id: 1,
      user_id: 2,
      content: 'Comment from project member'
    };

    const result = await createComment(memberCommentInput);

    expect(result.user_id).toEqual(2);
    expect(result.content).toEqual('Comment from project member');
  });

  it('should throw error when issue does not exist', async () => {
    // Create user but no issue
    await db.insert(usersTable).values(testUser).execute();

    const invalidInput: CreateCommentInput = {
      issue_id: 999,
      user_id: 1,
      content: 'Comment on non-existent issue'
    };

    await expect(createComment(invalidInput)).rejects.toThrow(/issue not found/i);
  });

  it('should throw error when user has no access to project', async () => {
    // Create users, project, and issue
    await db.insert(usersTable).values([testUser, testUser2]).execute();
    await db.insert(projectsTable).values(testProject).execute();
    await db.insert(issuesTable).values(testIssue).execute();

    // User2 is not a project member or creator
    const unauthorizedInput: CreateCommentInput = {
      issue_id: 1,
      user_id: 2,
      content: 'Unauthorized comment'
    };

    await expect(createComment(unauthorizedInput)).rejects.toThrow(/user does not have access/i);
  });

  it('should allow view role members to create comments', async () => {
    // Create users, project, and issue
    await db.insert(usersTable).values([testUser, testUser2]).execute();
    await db.insert(projectsTable).values(testProject).execute();
    await db.insert(issuesTable).values(testIssue).execute();

    // Add user2 as project member with view role
    await db.insert(projectMembersTable).values({
      project_id: 1,
      user_id: 2,
      role: 'view'
    }).execute();

    const viewMemberInput: CreateCommentInput = {
      issue_id: 1,
      user_id: 2,
      content: 'Comment from view member'
    };

    const result = await createComment(viewMemberInput);

    expect(result.user_id).toEqual(2);
    expect(result.content).toEqual('Comment from view member');
  });
});
