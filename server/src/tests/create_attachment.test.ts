
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, issuesTable, attachmentsTable, projectMembersTable } from '../db/schema';
import { type CreateAttachmentInput } from '../schema';
import { createAttachment } from '../handlers/create_attachment';
import { eq } from 'drizzle-orm';

describe('createAttachment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let projectId: number;
  let issueId: number;
  let memberId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        github_username: 'testuser',
        avatar_url: 'https://example.com/avatar.jpg'
      })
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create another user for member tests
    const memberResult = await db.insert(usersTable)
      .values({
        email: 'member@example.com',
        name: 'Member User',
        github_username: 'memberuser'
      })
      .returning()
      .execute();
    memberId = memberResult[0].id;

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        github_repo_url: 'https://github.com/testowner/testrepo',
        github_repo_name: 'testrepo',
        github_owner: 'testowner',
        created_by: userId
      })
      .returning()
      .execute();
    projectId = projectResult[0].id;

    // Create test issue
    const issueResult = await db.insert(issuesTable)
      .values({
        project_id: projectId,
        title: 'Test Issue',
        description: 'A test issue',
        priority: 'medium',
        status: 'open',
        created_by: userId
      })
      .returning()
      .execute();
    issueId = issueResult[0].id;
  });

  const testInput: CreateAttachmentInput = {
    issue_id: 0, // Will be set in tests
    filename: 'test-file.pdf',
    file_url: 'https://example.com/files/test-file.pdf',
    file_size: 1024,
    mime_type: 'application/pdf',
    uploaded_by: 0 // Will be set in tests
  };

  it('should create an attachment for project creator', async () => {
    const input = {
      ...testInput,
      issue_id: issueId,
      uploaded_by: userId
    };

    const result = await createAttachment(input);

    expect(result.issue_id).toEqual(issueId);
    expect(result.filename).toEqual('test-file.pdf');
    expect(result.file_url).toEqual('https://example.com/files/test-file.pdf');
    expect(result.file_size).toEqual(1024);
    expect(result.mime_type).toEqual('application/pdf');
    expect(result.uploaded_by).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.uploaded_at).toBeInstanceOf(Date);
  });

  it('should save attachment to database', async () => {
    const input = {
      ...testInput,
      issue_id: issueId,
      uploaded_by: userId
    };

    const result = await createAttachment(input);

    const attachments = await db.select()
      .from(attachmentsTable)
      .where(eq(attachmentsTable.id, result.id))
      .execute();

    expect(attachments).toHaveLength(1);
    expect(attachments[0].filename).toEqual('test-file.pdf');
    expect(attachments[0].file_size).toEqual(1024);
    expect(attachments[0].uploaded_at).toBeInstanceOf(Date);
  });

  it('should create attachment for project member', async () => {
    // Add member to project
    await db.insert(projectMembersTable)
      .values({
        project_id: projectId,
        user_id: memberId,
        role: 'edit'
      })
      .execute();

    const input = {
      ...testInput,
      issue_id: issueId,
      uploaded_by: memberId
    };

    const result = await createAttachment(input);

    expect(result.uploaded_by).toEqual(memberId);
    expect(result.filename).toEqual('test-file.pdf');
  });

  it('should throw error for non-existent issue', async () => {
    const input = {
      ...testInput,
      issue_id: 999999,
      uploaded_by: userId
    };

    await expect(createAttachment(input)).rejects.toThrow(/issue not found/i);
  });

  it('should throw error for user without project access', async () => {
    const input = {
      ...testInput,
      issue_id: issueId,
      uploaded_by: memberId // Not a member of the project
    };

    await expect(createAttachment(input)).rejects.toThrow(/does not have access/i);
  });

  it('should handle different file types', async () => {
    const input = {
      ...testInput,
      issue_id: issueId,
      uploaded_by: userId,
      filename: 'image.png',
      file_url: 'https://example.com/files/image.png',
      file_size: 2048,
      mime_type: 'image/png'
    };

    const result = await createAttachment(input);

    expect(result.filename).toEqual('image.png');
    expect(result.mime_type).toEqual('image/png');
    expect(result.file_size).toEqual(2048);
  });
});
