
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';

const testUser1: CreateUserInput = {
  email: 'user1@example.com',
  name: 'Test User 1',
  github_username: 'testuser1',
  avatar_url: 'https://example.com/avatar1.jpg'
};

const testUser2: CreateUserInput = {
  email: 'user2@example.com',
  name: 'Test User 2',
  github_username: null,
  avatar_url: null
};

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const users = await getUsers();
    expect(users).toEqual([]);
  });

  it('should return all users', async () => {
    // Create test users
    await db.insert(usersTable)
      .values([
        {
          email: testUser1.email,
          name: testUser1.name,
          github_username: testUser1.github_username,
          avatar_url: testUser1.avatar_url
        },
        {
          email: testUser2.email,
          name: testUser2.name,
          github_username: testUser2.github_username,
          avatar_url: testUser2.avatar_url
        }
      ])
      .execute();

    const users = await getUsers();

    expect(users).toHaveLength(2);
    
    // Verify first user
    expect(users[0].email).toEqual('user1@example.com');
    expect(users[0].name).toEqual('Test User 1');
    expect(users[0].github_username).toEqual('testuser1');
    expect(users[0].avatar_url).toEqual('https://example.com/avatar1.jpg');
    expect(users[0].id).toBeDefined();
    expect(users[0].created_at).toBeInstanceOf(Date);

    // Verify second user
    expect(users[1].email).toEqual('user2@example.com');
    expect(users[1].name).toEqual('Test User 2');
    expect(users[1].github_username).toBeNull();
    expect(users[1].avatar_url).toBeNull();
    expect(users[1].id).toBeDefined();
    expect(users[1].created_at).toBeInstanceOf(Date);
  });

  it('should return users ordered by creation time', async () => {
    // Create users in specific order
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'first@example.com',
        name: 'First User',
        github_username: null,
        avatar_url: null
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'second@example.com',
        name: 'Second User',
        github_username: null,
        avatar_url: null
      })
      .returning()
      .execute();

    const users = await getUsers();

    expect(users).toHaveLength(2);
    expect(users[0].id).toEqual(user1Result[0].id);
    expect(users[1].id).toEqual(user2Result[0].id);
    expect(users[0].created_at <= users[1].created_at).toBe(true);
  });
});
