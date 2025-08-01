
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, projectMembersTable } from '../db/schema';
import { type InviteUserToProjectInput } from '../schema';
import { inviteUserToProject } from '../handlers/invite_user_to_project';
import { eq, and } from 'drizzle-orm';

describe('inviteUserToProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should invite a user to a project', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create test project creator
    const creatorResult = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        name: 'Project Creator'
      })
      .returning()
      .execute();
    const creator = creatorResult[0];

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        github_repo_url: 'https://github.com/test/repo',
        github_repo_name: 'repo',
        github_owner: 'test',
        created_by: creator.id
      })
      .returning()
      .execute();
    const project = projectResult[0];

    const input: InviteUserToProjectInput = {
      project_id: project.id,
      user_id: user.id,
      role: 'view'
    };

    const result = await inviteUserToProject(input);

    // Verify the invitation result
    expect(result.project_id).toEqual(project.id);
    expect(result.user_id).toEqual(user.id);
    expect(result.role).toEqual('view');
    expect(result.id).toBeDefined();
    expect(result.invited_at).toBeInstanceOf(Date);
  });

  it('should save the invitation to database', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create test project creator
    const creatorResult = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        name: 'Project Creator'
      })
      .returning()
      .execute();
    const creator = creatorResult[0];

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        github_repo_url: 'https://github.com/test/repo',
        github_repo_name: 'repo',
        github_owner: 'test',
        created_by: creator.id
      })
      .returning()
      .execute();
    const project = projectResult[0];

    const input: InviteUserToProjectInput = {
      project_id: project.id,
      user_id: user.id,
      role: 'edit'
    };

    const result = await inviteUserToProject(input);

    // Query the database to verify the invitation was saved
    const memberships = await db.select()
      .from(projectMembersTable)
      .where(eq(projectMembersTable.id, result.id))
      .execute();

    expect(memberships).toHaveLength(1);
    expect(memberships[0].project_id).toEqual(project.id);
    expect(memberships[0].user_id).toEqual(user.id);
    expect(memberships[0].role).toEqual('edit');
    expect(memberships[0].invited_at).toBeInstanceOf(Date);
  });

  it('should throw error when project does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    const input: InviteUserToProjectInput = {
      project_id: 999, // Non-existent project
      user_id: user.id,
      role: 'view'
    };

    await expect(inviteUserToProject(input)).rejects.toThrow(/project not found/i);
  });

  it('should throw error when user does not exist', async () => {
    // Create test project creator
    const creatorResult = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        name: 'Project Creator'
      })
      .returning()
      .execute();
    const creator = creatorResult[0];

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        github_repo_url: 'https://github.com/test/repo',
        github_repo_name: 'repo',
        github_owner: 'test',
        created_by: creator.id
      })
      .returning()
      .execute();
    const project = projectResult[0];

    const input: InviteUserToProjectInput = {
      project_id: project.id,
      user_id: 999, // Non-existent user
      role: 'view'
    };

    await expect(inviteUserToProject(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when user is already a member', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create test project creator
    const creatorResult = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        name: 'Project Creator'
      })
      .returning()
      .execute();
    const creator = creatorResult[0];

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        github_repo_url: 'https://github.com/test/repo',
        github_repo_name: 'repo',
        github_owner: 'test',
        created_by: creator.id
      })
      .returning()
      .execute();
    const project = projectResult[0];

    // Create initial membership
    await db.insert(projectMembersTable)
      .values({
        project_id: project.id,
        user_id: user.id,
        role: 'view'
      })
      .execute();

    const input: InviteUserToProjectInput = {
      project_id: project.id,
      user_id: user.id,
      role: 'edit'
    };

    await expect(inviteUserToProject(input)).rejects.toThrow(/already a member/i);
  });

  it('should allow different users to be invited to the same project', async () => {
    // Create test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        name: 'User One'
      })
      .returning()
      .execute();
    const user1 = user1Result[0];

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        name: 'User Two'
      })
      .returning()
      .execute();
    const user2 = user2Result[0];

    // Create test project creator
    const creatorResult = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        name: 'Project Creator'
      })
      .returning()
      .execute();
    const creator = creatorResult[0];

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        github_repo_url: 'https://github.com/test/repo',
        github_repo_name: 'repo',
        github_owner: 'test',
        created_by: creator.id
      })
      .returning()
      .execute();
    const project = projectResult[0];

    // Invite first user
    const input1: InviteUserToProjectInput = {
      project_id: project.id,
      user_id: user1.id,
      role: 'view'
    };

    const result1 = await inviteUserToProject(input1);

    // Invite second user
    const input2: InviteUserToProjectInput = {
      project_id: project.id,
      user_id: user2.id,
      role: 'edit'
    };

    const result2 = await inviteUserToProject(input2);

    // Verify both invitations exist
    const memberships = await db.select()
      .from(projectMembersTable)
      .where(eq(projectMembersTable.project_id, project.id))
      .execute();

    expect(memberships).toHaveLength(2);
    expect(memberships.find(m => m.user_id === user1.id)?.role).toEqual('view');
    expect(memberships.find(m => m.user_id === user2.id)?.role).toEqual('edit');
  });
});
