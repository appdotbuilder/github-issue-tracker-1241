
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, projectMembersTable } from '../db/schema';
import { getProjectMembers } from '../handlers/get_project_members';

describe('getProjectMembers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when project has no members', async () => {
    // Create a user and project first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        name: 'Creator User'
      })
      .returning()
      .execute();

    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        github_repo_url: 'https://github.com/test/repo',
        github_repo_name: 'repo',
        github_owner: 'test',
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    const members = await getProjectMembers(projectResult[0].id);

    expect(members).toEqual([]);
  });

  it('should return project members when they exist', async () => {
    // Create users
    const userResults = await db.insert(usersTable)
      .values([
        {
          email: 'creator@example.com',
          name: 'Creator User'
        },
        {
          email: 'member1@example.com',
          name: 'Member One'
        },
        {
          email: 'member2@example.com',
          name: 'Member Two'
        }
      ])
      .returning()
      .execute();

    // Create project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        github_repo_url: 'https://github.com/test/repo',
        github_repo_name: 'repo',
        github_owner: 'test',
        created_by: userResults[0].id
      })
      .returning()
      .execute();

    // Add project members
    await db.insert(projectMembersTable)
      .values([
        {
          project_id: projectResult[0].id,
          user_id: userResults[1].id,
          role: 'edit'
        },
        {
          project_id: projectResult[0].id,
          user_id: userResults[2].id,
          role: 'view'
        }
      ])
      .execute();

    const members = await getProjectMembers(projectResult[0].id);

    expect(members).toHaveLength(2);
    expect(members[0].project_id).toEqual(projectResult[0].id);
    expect(members[0].user_id).toEqual(userResults[1].id);
    expect(members[0].role).toEqual('edit');
    expect(members[0].invited_at).toBeInstanceOf(Date);
    expect(members[0].id).toBeDefined();

    expect(members[1].project_id).toEqual(projectResult[0].id);
    expect(members[1].user_id).toEqual(userResults[2].id);
    expect(members[1].role).toEqual('view');
    expect(members[1].invited_at).toBeInstanceOf(Date);
    expect(members[1].id).toBeDefined();
  });

  it('should only return members for the specified project', async () => {
    // Create users
    const userResults = await db.insert(usersTable)
      .values([
        {
          email: 'creator@example.com',
          name: 'Creator User'
        },
        {
          email: 'member1@example.com',
          name: 'Member One'
        },
        {
          email: 'member2@example.com',
          name: 'Member Two'
        }
      ])
      .returning()
      .execute();

    // Create two projects
    const projectResults = await db.insert(projectsTable)
      .values([
        {
          name: 'Test Project 1',
          github_repo_url: 'https://github.com/test/repo1',
          github_repo_name: 'repo1',
          github_owner: 'test',
          created_by: userResults[0].id
        },
        {
          name: 'Test Project 2',
          github_repo_url: 'https://github.com/test/repo2',
          github_repo_name: 'repo2',
          github_owner: 'test',
          created_by: userResults[0].id
        }
      ])
      .returning()
      .execute();

    // Add members to both projects
    await db.insert(projectMembersTable)
      .values([
        {
          project_id: projectResults[0].id,
          user_id: userResults[1].id,
          role: 'edit'
        },
        {
          project_id: projectResults[1].id,
          user_id: userResults[2].id,
          role: 'view'
        }
      ])
      .execute();

    // Get members for first project only
    const members = await getProjectMembers(projectResults[0].id);

    expect(members).toHaveLength(1);
    expect(members[0].project_id).toEqual(projectResults[0].id);
    expect(members[0].user_id).toEqual(userResults[1].id);
    expect(members[0].role).toEqual('edit');
  });
});
