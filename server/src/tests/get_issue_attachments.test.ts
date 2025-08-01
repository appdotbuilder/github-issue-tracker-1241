
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, issuesTable, attachmentsTable } from '../db/schema';
import { getIssueAttachments } from '../handlers/get_issue_attachments';

describe('getIssueAttachments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return attachments for a specific issue', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        github_repo_url: 'https://github.com/test/repo',
        github_repo_name: 'repo',
        github_owner: 'test',
        created_by: userId
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    // Create test issue
    const issueResult = await db.insert(issuesTable)
      .values({
        project_id: projectId,
        title: 'Test Issue',
        priority: 'medium',
        status: 'open',
        created_by: userId
      })
      .returning()
      .execute();
    const issueId = issueResult[0].id;

    // Create test attachments
    await db.insert(attachmentsTable)
      .values([
        {
          issue_id: issueId,
          filename: 'screenshot.png',
          file_url: 'https://example.com/files/screenshot.png',
          file_size: 1024,
          mime_type: 'image/png',
          uploaded_by: userId
        },
        {
          issue_id: issueId,
          filename: 'document.pdf',
          file_url: 'https://example.com/files/document.pdf',
          file_size: 2048,
          mime_type: 'application/pdf',
          uploaded_by: userId
        }
      ])
      .execute();

    const result = await getIssueAttachments(issueId);

    expect(result).toHaveLength(2);
    
    // Check first attachment
    const attachment1 = result.find(a => a.filename === 'screenshot.png');
    expect(attachment1).toBeDefined();
    expect(attachment1!.issue_id).toEqual(issueId);
    expect(attachment1!.file_url).toEqual('https://example.com/files/screenshot.png');
    expect(attachment1!.file_size).toEqual(1024);
    expect(attachment1!.mime_type).toEqual('image/png');
    expect(attachment1!.uploaded_by).toEqual(userId);
    expect(attachment1!.uploaded_at).toBeInstanceOf(Date);
    expect(attachment1!.id).toBeDefined();

    // Check second attachment
    const attachment2 = result.find(a => a.filename === 'document.pdf');
    expect(attachment2).toBeDefined();
    expect(attachment2!.issue_id).toEqual(issueId);
    expect(attachment2!.file_url).toEqual('https://example.com/files/document.pdf');
    expect(attachment2!.file_size).toEqual(2048);
    expect(attachment2!.mime_type).toEqual('application/pdf');
    expect(attachment2!.uploaded_by).toEqual(userId);
    expect(attachment2!.uploaded_at).toBeInstanceOf(Date);
  });

  it('should return empty array for issue with no attachments', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        github_repo_url: 'https://github.com/test/repo',
        github_repo_name: 'repo',
        github_owner: 'test',
        created_by: userId
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    // Create test issue without attachments
    const issueResult = await db.insert(issuesTable)
      .values({
        project_id: projectId,
        title: 'Test Issue',
        priority: 'medium',
        status: 'open',
        created_by: userId
      })
      .returning()
      .execute();
    const issueId = issueResult[0].id;

    const result = await getIssueAttachments(issueId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should not return attachments from other issues', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        github_repo_url: 'https://github.com/test/repo',
        github_repo_name: 'repo',
        github_owner: 'test',
        created_by: userId
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    // Create two test issues
    const issueResults = await db.insert(issuesTable)
      .values([
        {
          project_id: projectId,
          title: 'Issue 1',
          priority: 'medium',
          status: 'open',
          created_by: userId
        },
        {
          project_id: projectId,
          title: 'Issue 2',
          priority: 'high',
          status: 'open',
          created_by: userId
        }
      ])
      .returning()
      .execute();
    const issue1Id = issueResults[0].id;
    const issue2Id = issueResults[1].id;

    // Create attachments for both issues
    await db.insert(attachmentsTable)
      .values([
        {
          issue_id: issue1Id,
          filename: 'issue1_attachment.png',
          file_url: 'https://example.com/files/issue1.png',
          file_size: 1024,
          mime_type: 'image/png',
          uploaded_by: userId
        },
        {
          issue_id: issue2Id,
          filename: 'issue2_attachment.pdf',
          file_url: 'https://example.com/files/issue2.pdf',
          file_size: 2048,
          mime_type: 'application/pdf',
          uploaded_by: userId
        }
      ])
      .execute();

    const result = await getIssueAttachments(issue1Id);

    expect(result).toHaveLength(1);
    expect(result[0].filename).toEqual('issue1_attachment.png');
    expect(result[0].issue_id).toEqual(issue1Id);
  });
});
