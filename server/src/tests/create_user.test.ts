
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  github_username: 'testuser',
  avatar_url: 'https://example.com/avatar.jpg'
};

// Minimal test input
const minimalInput: CreateUserInput = {
  email: 'minimal@example.com',
  name: 'Minimal User'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with all fields', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test User');
    expect(result.github_username).toEqual('testuser');
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a user with minimal fields', async () => {
    const result = await createUser(minimalInput);

    expect(result.email).toEqual('minimal@example.com');
    expect(result.name).toEqual('Minimal User');
    expect(result.github_username).toBeNull();
    expect(result.avatar_url).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].name).toEqual('Test User');
    expect(users[0].github_username).toEqual('testuser');
    expect(users[0].avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should enforce email uniqueness', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same email
    const duplicateInput: CreateUserInput = {
      email: 'test@example.com', // Same email
      name: 'Another User'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should handle null optional fields correctly', async () => {
    const inputWithUndefined: CreateUserInput = {
      email: 'undefined@example.com',
      name: 'Undefined User',
      github_username: undefined,
      avatar_url: undefined
    };

    const result = await createUser(inputWithUndefined);

    expect(result.github_username).toBeNull();
    expect(result.avatar_url).toBeNull();

    // Verify in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users[0].github_username).toBeNull();
    expect(users[0].avatar_url).toBeNull();
  });
});
