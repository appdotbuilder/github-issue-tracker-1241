
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, issuesTable, commentsTable } from '../db/schema';
import { type CreateUserInput, type CreateProjectInput, type CreateIssueInput, type CreateCommentInput } from '../schema';
import { getIssueComments } from '../handlers/get_issue_comments';

// Test data
const testUser1: CreateUserInput = {
  email: 'user1@example.com',
  name: 'Test User 1',
  github_username: 'testuser1',
  avatar_url: 'https://example.com/avatar1.jpg'
};

const testUser2: CreateUserInput = {
  email: 'user2@example.com',
  name: 'Test User 2',
  github_username: 'testuser2',
  avatar_url: 'https://example.com/avatar2.jpg'
};

const testProject: CreateProjectInput = {
  name: 'Test Project',
  description: 'A test project',
  github_repo_url: 'https://github.com/owner/repo',
  github_repo_name: 'repo',
  github_owner: 'owner',
  created_by: 1 // Will be set dynamically
};

const testIssue: CreateIssueInput = {
  project_id: 1, // Will be set dynamically
  title: 'Test Issue',
  description: 'A test issue',
  priority: 'medium',
  status: 'open',
  created_by: 1 // Will be set dynamically
};

describe('getIssueComments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for issue with no comments', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values(testUser1)
      .returning()
      .execute()
      .then(result => result[0]);

    const project = await db.insert(projectsTable)
      .values({
        ...testProject,
        created_by: user.id
      })
      .returning()
      .execute()
      .then(result => result[0]);

    const issue = await db.insert(issuesTable)
      .values({
        ...testIssue,
        project_id: project.id,
        created_by: user.id
      })
      .returning()
      .execute()
      .then(result => result[0]);

    const comments = await getIssueComments(issue.id);

    expect(comments).toEqual([]);
  });

  it('should return comments for an issue ordered by creation time', async () => {
    // Create prerequisite data
    const user1 = await db.insert(usersTable)
      .values(testUser1)
      .returning()
      .execute()
      .then(result => result[0]);

    const user2 = await db.insert(usersTable)
      .values(testUser2)
      .returning()
      .execute()
      .then(result => result[0]);

    const project = await db.insert(projectsTable)
      .values({
        ...testProject,
        created_by: user1.id
      })
      .returning()
      .execute()
      .then(result => result[0]);

    const issue = await db.insert(issuesTable)
      .values({
        ...testIssue,
        project_id: project.id,
        created_by: user1.id
      })
      .returning()
      .execute()
      .then(result => result[0]);

    // Create comments with slight delay to ensure different timestamps
    const comment1 = await db.insert(commentsTable)
      .values({
        issue_id: issue.id,
        user_id: user1.id,
        content: 'First comment'
      })
      .returning()
      .execute()
      .then(result => result[0]);

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const comment2 = await db.insert(commentsTable)
      .values({
        issue_id: issue.id,
        user_id: user2.id,
        content: 'Second comment'
      })
      .returning()
      .execute()
      .then(result => result[0]);

    const comments = await getIssueComments(issue.id);

    expect(comments).toHaveLength(2);
    
    // Verify first comment
    expect(comments[0].id).toEqual(comment1.id);
    expect(comments[0].issue_id).toEqual(issue.id);
    expect(comments[0].user_id).toEqual(user1.id);
    expect(comments[0].content).toEqual('First comment');
    expect(comments[0].created_at).toBeInstanceOf(Date);
    expect(comments[0].updated_at).toBeInstanceOf(Date);

    // Verify second comment
    expect(comments[1].id).toEqual(comment2.id);
    expect(comments[1].issue_id).toEqual(issue.id);
    expect(comments[1].user_id).toEqual(user2.id);
    expect(comments[1].content).toEqual('Second comment');
    expect(comments[1].created_at).toBeInstanceOf(Date);
    expect(comments[1].updated_at).toBeInstanceOf(Date);

    // Verify ordering (oldest first)
    expect(comments[0].created_at.getTime()).toBeLessThanOrEqual(comments[1].created_at.getTime());
  });

  it('should only return comments for the specified issue', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values(testUser1)
      .returning()
      .execute()
      .then(result => result[0]);

    const project = await db.insert(projectsTable)
      .values({
        ...testProject,
        created_by: user.id
      })
      .returning()
      .execute()
      .then(result => result[0]);

    const issue1 = await db.insert(issuesTable)
      .values({
        ...testIssue,
        title: 'First Issue',
        project_id: project.id,
        created_by: user.id
      })
      .returning()
      .execute()
      .then(result => result[0]);

    const issue2 = await db.insert(issuesTable)
      .values({
        ...testIssue,
        title: 'Second Issue',
        project_id: project.id,
        created_by: user.id
      })
      .returning()
      .execute()
      .then(result => result[0]);

    // Create comments for both issues
    await db.insert(commentsTable)
      .values({
        issue_id: issue1.id,
        user_id: user.id,
        content: 'Comment for issue 1'
      })
      .execute();

    await db.insert(commentsTable)
      .values({
        issue_id: issue2.id,
        user_id: user.id,
        content: 'Comment for issue 2'
      })
      .execute();

    // Get comments for issue 1 only
    const comments = await getIssueComments(issue1.id);

    expect(comments).toHaveLength(1);
    expect(comments[0].issue_id).toEqual(issue1.id);
    expect(comments[0].content).toEqual('Comment for issue 1');
  });

  it('should handle non-existent issue gracefully', async () => {
    const comments = await getIssueComments(999);
    expect(comments).toEqual([]);
  });
});
