
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, issuesTable } from '../db/schema';
import { getProjectIssues } from '../handlers/get_project_issues';

describe('getProjectIssues', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for project with no issues', async () => {
    // Create a user and project
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        github_repo_url: 'https://github.com/test/repo',
        github_repo_name: 'repo',
        github_owner: 'test',
        created_by: user[0].id
      })
      .returning()
      .execute();

    const result = await getProjectIssues(project[0].id);

    expect(result).toEqual([]);
  });

  it('should return all issues for a project', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        github_repo_url: 'https://github.com/test/repo',
        github_repo_name: 'repo',
        github_owner: 'test',
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Create test issues
    const issues = await db.insert(issuesTable)
      .values([
        {
          project_id: project[0].id,
          title: 'First Issue',
          description: 'First issue description',
          priority: 'high',
          status: 'open',
          created_by: user[0].id
        },
        {
          project_id: project[0].id,
          title: 'Second Issue',
          description: 'Second issue description',
          priority: 'medium',
          status: 'in_progress',
          assigned_to: user[0].id,
          created_by: user[0].id
        }
      ])
      .returning()
      .execute();

    const result = await getProjectIssues(project[0].id);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('First Issue');
    expect(result[0].priority).toEqual('high');
    expect(result[0].status).toEqual('open');
    expect(result[0].assigned_to).toBeNull();
    expect(result[1].title).toEqual('Second Issue');
    expect(result[1].priority).toEqual('medium');
    expect(result[1].status).toEqual('in_progress');
    expect(result[1].assigned_to).toEqual(user[0].id);
  });

  it('should filter issues by status', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        github_repo_url: 'https://github.com/test/repo',
        github_repo_name: 'repo',
        github_owner: 'test',
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Create issues with different statuses
    await db.insert(issuesTable)
      .values([
        {
          project_id: project[0].id,
          title: 'Open Issue',
          priority: 'high',
          status: 'open',
          created_by: user[0].id
        },
        {
          project_id: project[0].id,
          title: 'Closed Issue',
          priority: 'medium',
          status: 'closed',
          created_by: user[0].id
        }
      ])
      .execute();

    const result = await getProjectIssues(project[0].id, { status: 'open' });

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Open Issue');
    expect(result[0].status).toEqual('open');
  });

  it('should filter issues by priority', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        github_repo_url: 'https://github.com/test/repo',
        github_repo_name: 'repo',
        github_owner: 'test',
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Create issues with different priorities
    await db.insert(issuesTable)
      .values([
        {
          project_id: project[0].id,
          title: 'Critical Issue',
          priority: 'critical',
          status: 'open',
          created_by: user[0].id
        },
        {
          project_id: project[0].id,
          title: 'Low Priority Issue',
          priority: 'low',
          status: 'open',
          created_by: user[0].id
        }
      ])
      .execute();

    const result = await getProjectIssues(project[0].id, { priority: 'critical' });

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Critical Issue');
    expect(result[0].priority).toEqual('critical');
  });

  it('should filter issues by assigned user', async () => {
    // Create prerequisite data
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          name: 'User 1'
        },
        {
          email: 'user2@example.com',
          name: 'User 2'
        }
      ])
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        github_repo_url: 'https://github.com/test/repo',
        github_repo_name: 'repo',
        github_owner: 'test',
        created_by: users[0].id
      })
      .returning()
      .execute();

    // Create issues with different assignees
    await db.insert(issuesTable)
      .values([
        {
          project_id: project[0].id,
          title: 'Assigned to User 1',
          priority: 'high',
          status: 'open',
          assigned_to: users[0].id,
          created_by: users[0].id
        },
        {
          project_id: project[0].id,
          title: 'Assigned to User 2',
          priority: 'medium',
          status: 'open',
          assigned_to: users[1].id,
          created_by: users[0].id
        },
        {
          project_id: project[0].id,
          title: 'Unassigned Issue',
          priority: 'low',
          status: 'open',
          created_by: users[0].id
        }
      ])
      .execute();

    const result = await getProjectIssues(project[0].id, { assigned_to: users[0].id });

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Assigned to User 1');
    expect(result[0].assigned_to).toEqual(users[0].id);
  });

  it('should apply multiple filters simultaneously', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        github_repo_url: 'https://github.com/test/repo',
        github_repo_name: 'repo',
        github_owner: 'test',
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Create various issues
    await db.insert(issuesTable)
      .values([
        {
          project_id: project[0].id,
          title: 'Match All Filters',
          priority: 'high',
          status: 'open',
          assigned_to: user[0].id,
          created_by: user[0].id
        },
        {
          project_id: project[0].id,
          title: 'Wrong Status',
          priority: 'high',
          status: 'closed',
          assigned_to: user[0].id,
          created_by: user[0].id
        }
      ])
      .execute();

    const result = await getProjectIssues(project[0].id, {
      status: 'open',
      priority: 'high',
      assigned_to: user[0].id
    });

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Match All Filters');
  });

  it('should not return issues from different projects', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    const projects = await db.insert(projectsTable)
      .values([
        {
          name: 'Project 1',
          github_repo_url: 'https://github.com/test/repo1',
          github_repo_name: 'repo1',
          github_owner: 'test',
          created_by: user[0].id
        },
        {
          name: 'Project 2',
          github_repo_url: 'https://github.com/test/repo2',
          github_repo_name: 'repo2',
          github_owner: 'test',
          created_by: user[0].id
        }
      ])
      .returning()
      .execute();

    // Create issues in both projects
    await db.insert(issuesTable)
      .values([
        {
          project_id: projects[0].id,
          title: 'Issue in Project 1',
          priority: 'high',
          status: 'open',
          created_by: user[0].id
        },
        {
          project_id: projects[1].id,
          title: 'Issue in Project 2',
          priority: 'high',
          status: 'open',
          created_by: user[0].id
        }
      ])
      .execute();

    const result = await getProjectIssues(projects[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Issue in Project 1');
    expect(result[0].project_id).toEqual(projects[0].id);
  });
});
