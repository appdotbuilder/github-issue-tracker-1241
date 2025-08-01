
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable } from '../db/schema';
import { type CreateUserInput, type CreateProjectInput } from '../schema';
import { getProjects } from '../handlers/get_projects';

describe('getProjects', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no projects exist', async () => {
    const result = await getProjects();
    expect(result).toEqual([]);
  });

  it('should return all projects', async () => {
    // Create test user first
    const userInput: CreateUserInput = {
      email: 'test@example.com',
      name: 'Test User',
      github_username: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg'
    };

    const userResult = await db.insert(usersTable)
      .values(userInput)
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test projects
    const projectInput1: CreateProjectInput = {
      name: 'Test Project 1',
      description: 'First test project',
      github_repo_url: 'https://github.com/owner/repo1',
      github_repo_name: 'repo1',
      github_owner: 'owner',
      created_by: userId
    };

    const projectInput2: CreateProjectInput = {
      name: 'Test Project 2',
      description: 'Second test project',
      github_repo_url: 'https://github.com/owner/repo2',
      github_repo_name: 'repo2',
      github_owner: 'owner',
      created_by: userId
    };

    await db.insert(projectsTable)
      .values([projectInput1, projectInput2])
      .execute();

    const result = await getProjects();

    expect(result).toHaveLength(2);
    
    // Verify first project
    expect(result[0].name).toEqual('Test Project 1');
    expect(result[0].description).toEqual('First test project');
    expect(result[0].github_repo_url).toEqual('https://github.com/owner/repo1');
    expect(result[0].github_repo_name).toEqual('repo1');
    expect(result[0].github_owner).toEqual('owner');
    expect(result[0].created_by).toEqual(userId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second project
    expect(result[1].name).toEqual('Test Project 2');
    expect(result[1].description).toEqual('Second test project');
    expect(result[1].github_repo_url).toEqual('https://github.com/owner/repo2');
    expect(result[1].github_repo_name).toEqual('repo2');
    expect(result[1].github_owner).toEqual('owner');
    expect(result[1].created_by).toEqual(userId);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return projects with null descriptions', async () => {
    // Create test user
    const userInput: CreateUserInput = {
      email: 'test@example.com',
      name: 'Test User',
      github_username: 'testuser',
      avatar_url: null
    };

    const userResult = await db.insert(usersTable)
      .values(userInput)
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create project without description
    const projectInput: CreateProjectInput = {
      name: 'Project Without Description',
      description: null,
      github_repo_url: 'https://github.com/owner/repo',
      github_repo_name: 'repo',
      github_owner: 'owner',
      created_by: userId
    };

    await db.insert(projectsTable)
      .values(projectInput)
      .execute();

    const result = await getProjects();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Project Without Description');
    expect(result[0].description).toBeNull();
    expect(result[0].github_repo_url).toEqual('https://github.com/owner/repo');
    expect(result[0].created_by).toEqual(userId);
  });
});
