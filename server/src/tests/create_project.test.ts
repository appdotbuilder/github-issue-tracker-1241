
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, projectMembersTable, usersTable } from '../db/schema';
import { type CreateProjectInput } from '../schema';
import { createProject } from '../handlers/create_project';
import { eq } from 'drizzle-orm';

// Create a test user first since project needs created_by reference
const createTestUser = async () => {
  const userResult = await db.insert(usersTable)
    .values({
      email: 'test@example.com',
      name: 'Test User'
    })
    .returning()
    .execute();
  return userResult[0];
};

const testInput: CreateProjectInput = {
  name: 'Test Project',
  description: 'A project for testing',
  github_repo_url: 'https://github.com/testowner/testrepo',
  github_repo_name: 'testrepo',
  github_owner: 'testowner',
  created_by: 1 // Will be updated with actual user ID
};

describe('createProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a project', async () => {
    const user = await createTestUser();
    const input = { ...testInput, created_by: user.id };

    const result = await createProject(input);

    // Basic field validation
    expect(result.name).toEqual('Test Project');
    expect(result.description).toEqual('A project for testing');
    expect(result.github_repo_url).toEqual('https://github.com/testowner/testrepo');
    expect(result.github_repo_name).toEqual('testrepo');
    expect(result.github_owner).toEqual('testowner');
    expect(result.created_by).toEqual(user.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save project to database', async () => {
    const user = await createTestUser();
    const input = { ...testInput, created_by: user.id };

    const result = await createProject(input);

    // Query project from database
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects).toHaveLength(1);
    expect(projects[0].name).toEqual('Test Project');
    expect(projects[0].description).toEqual('A project for testing');
    expect(projects[0].github_repo_url).toEqual('https://github.com/testowner/testrepo');
    expect(projects[0].created_by).toEqual(user.id);
    expect(projects[0].created_at).toBeInstanceOf(Date);
  });

  it('should automatically add creator as project member with edit role', async () => {
    const user = await createTestUser();
    const input = { ...testInput, created_by: user.id };

    const result = await createProject(input);

    // Query project memberships
    const memberships = await db.select()
      .from(projectMembersTable)
      .where(eq(projectMembersTable.project_id, result.id))
      .execute();

    expect(memberships).toHaveLength(1);
    expect(memberships[0].project_id).toEqual(result.id);
    expect(memberships[0].user_id).toEqual(user.id);
    expect(memberships[0].role).toEqual('edit');
    expect(memberships[0].invited_at).toBeInstanceOf(Date);
  });

  it('should handle project with null description', async () => {
    const user = await createTestUser();
    const inputWithoutDescription = {
      ...testInput,
      created_by: user.id,
      description: undefined
    };

    const result = await createProject(inputWithoutDescription);

    expect(result.description).toBeNull();

    // Verify in database
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects[0].description).toBeNull();
  });

  it('should fail when created_by user does not exist', async () => {
    const inputWithInvalidUser = {
      ...testInput,
      created_by: 999 // Non-existent user ID
    };

    await expect(createProject(inputWithInvalidUser)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
