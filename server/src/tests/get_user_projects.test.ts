
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, projectMembersTable } from '../db/schema';
import { getUserProjects } from '../handlers/get_user_projects';

describe('getUserProjects', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return projects created by user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        name: 'Project Creator'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create project by user
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'My Project',
        description: 'A project I created',
        github_repo_url: 'https://github.com/creator/my-project',
        github_repo_name: 'my-project',
        github_owner: 'creator',
        created_by: userId
      })
      .returning()
      .execute();

    const projects = await getUserProjects(userId);

    expect(projects).toHaveLength(1);
    expect(projects[0].id).toEqual(projectResult[0].id);
    expect(projects[0].name).toEqual('My Project');
    expect(projects[0].description).toEqual('A project I created');
    expect(projects[0].created_by).toEqual(userId);
  });

  it('should return projects where user is a member', async () => {
    // Create project creator
    const creatorResult = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        name: 'Project Creator'
      })
      .returning()
      .execute();
    const creatorId = creatorResult[0].id;

    // Create member user
    const memberResult = await db.insert(usersTable)
      .values({
        email: 'member@example.com',
        name: 'Project Member'
      })
      .returning()
      .execute();
    const memberId = memberResult[0].id;

    // Create project by creator
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Team Project',
        description: 'A collaborative project',
        github_repo_url: 'https://github.com/creator/team-project',
        github_repo_name: 'team-project',
        github_owner: 'creator',
        created_by: creatorId
      })
      .returning()
      .execute();

    // Add member to project
    await db.insert(projectMembersTable)
      .values({
        project_id: projectResult[0].id,
        user_id: memberId,
        role: 'edit'
      })
      .execute();

    const projects = await getUserProjects(memberId);

    expect(projects).toHaveLength(1);
    expect(projects[0].id).toEqual(projectResult[0].id);
    expect(projects[0].name).toEqual('Team Project');
    expect(projects[0].created_by).toEqual(creatorId);
  });

  it('should return projects where user is both creator and member without duplicates', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'user@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create project by user
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Solo Project',
        description: 'A project I created and am also a member of',
        github_repo_url: 'https://github.com/user/solo-project',
        github_repo_name: 'solo-project',
        github_owner: 'user',
        created_by: userId
      })
      .returning()
      .execute();

    // Add user as explicit member (edge case)
    await db.insert(projectMembersTable)
      .values({
        project_id: projectResult[0].id,
        user_id: userId,
        role: 'edit'
      })
      .execute();

    const projects = await getUserProjects(userId);

    // Should return only one project, not duplicates
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toEqual(projectResult[0].id);
    expect(projects[0].name).toEqual('Solo Project');
  });

  it('should return empty array for user with no projects', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'lonely@example.com',
        name: 'Lonely User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const projects = await getUserProjects(userId);

    expect(projects).toHaveLength(0);
  });

  it('should return multiple projects for user', async () => {
    // Create test users
    const creatorResult = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        name: 'Project Creator'
      })
      .returning()
      .execute();
    const creatorId = creatorResult[0].id;

    const memberResult = await db.insert(usersTable)
      .values({
        email: 'member@example.com',
        name: 'Active Member'
      })
      .returning()
      .execute();
    const memberId = memberResult[0].id;

    // Create project owned by member
    const ownedProjectResult = await db.insert(projectsTable)
      .values({
        name: 'Owned Project',
        description: 'Project I own',
        github_repo_url: 'https://github.com/member/owned',
        github_repo_name: 'owned',
        github_owner: 'member',
        created_by: memberId
      })
      .returning()
      .execute();

    // Create project owned by creator
    const joinedProjectResult = await db.insert(projectsTable)
      .values({
        name: 'Joined Project',
        description: 'Project I joined',
        github_repo_url: 'https://github.com/creator/joined',
        github_repo_name: 'joined',
        github_owner: 'creator',
        created_by: creatorId
      })
      .returning()
      .execute();

    // Add member to creator's project
    await db.insert(projectMembersTable)
      .values({
        project_id: joinedProjectResult[0].id,
        user_id: memberId,
        role: 'view'
      })
      .execute();

    const projects = await getUserProjects(memberId);

    expect(projects).toHaveLength(2);
    
    const projectNames = projects.map(p => p.name).sort();
    expect(projectNames).toEqual(['Joined Project', 'Owned Project']);
    
    const ownedProject = projects.find(p => p.name === 'Owned Project');
    const joinedProject = projects.find(p => p.name === 'Joined Project');
    
    expect(ownedProject?.created_by).toEqual(memberId);
    expect(joinedProject?.created_by).toEqual(creatorId);
  });
});
