
import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['view', 'edit']);
export const issuePriorityEnum = pgEnum('issue_priority', ['low', 'medium', 'high', 'critical']);
export const issueStatusEnum = pgEnum('issue_status', ['open', 'in_progress', 'closed', 'resolved']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  github_username: text('github_username'),
  avatar_url: text('avatar_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Projects table
export const projectsTable = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  github_repo_url: text('github_repo_url').notNull(),
  github_repo_name: text('github_repo_name').notNull(),
  github_owner: text('github_owner').notNull(),
  created_by: integer('created_by').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Project members table (for invitations and roles)
export const projectMembersTable = pgTable('project_members', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull().references(() => projectsTable.id),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  role: userRoleEnum('role').notNull(),
  invited_at: timestamp('invited_at').defaultNow().notNull(),
});

// Issues table
export const issuesTable = pgTable('issues', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull().references(() => projectsTable.id),
  title: text('title').notNull(),
  description: text('description'),
  priority: issuePriorityEnum('priority').notNull(),
  status: issueStatusEnum('status').notNull().default('open'),
  assigned_to: integer('assigned_to').references(() => usersTable.id),
  created_by: integer('created_by').notNull().references(() => usersTable.id),
  due_date: timestamp('due_date'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Comments table
export const commentsTable = pgTable('comments', {
  id: serial('id').primaryKey(),
  issue_id: integer('issue_id').notNull().references(() => issuesTable.id),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  content: text('content').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Attachments table
export const attachmentsTable = pgTable('attachments', {
  id: serial('id').primaryKey(),
  issue_id: integer('issue_id').notNull().references(() => issuesTable.id),
  filename: text('filename').notNull(),
  file_url: text('file_url').notNull(),
  file_size: integer('file_size').notNull(),
  mime_type: text('mime_type').notNull(),
  uploaded_by: integer('uploaded_by').notNull().references(() => usersTable.id),
  uploaded_at: timestamp('uploaded_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  createdProjects: many(projectsTable),
  projectMemberships: many(projectMembersTable),
  createdIssues: many(issuesTable),
  assignedIssues: many(issuesTable),
  comments: many(commentsTable),
  attachments: many(attachmentsTable),
}));

export const projectsRelations = relations(projectsTable, ({ one, many }) => ({
  creator: one(usersTable, {
    fields: [projectsTable.created_by],
    references: [usersTable.id],
  }),
  members: many(projectMembersTable),
  issues: many(issuesTable),
}));

export const projectMembersRelations = relations(projectMembersTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [projectMembersTable.project_id],
    references: [projectsTable.id],
  }),
  user: one(usersTable, {
    fields: [projectMembersTable.user_id],
    references: [usersTable.id],
  }),
}));

export const issuesRelations = relations(issuesTable, ({ one, many }) => ({
  project: one(projectsTable, {
    fields: [issuesTable.project_id],
    references: [projectsTable.id],
  }),
  creator: one(usersTable, {
    fields: [issuesTable.created_by],
    references: [usersTable.id],
  }),
  assignee: one(usersTable, {
    fields: [issuesTable.assigned_to],
    references: [usersTable.id],
  }),
  comments: many(commentsTable),
  attachments: many(attachmentsTable),
}));

export const commentsRelations = relations(commentsTable, ({ one }) => ({
  issue: one(issuesTable, {
    fields: [commentsTable.issue_id],
    references: [issuesTable.id],
  }),
  user: one(usersTable, {
    fields: [commentsTable.user_id],
    references: [usersTable.id],
  }),
}));

export const attachmentsRelations = relations(attachmentsTable, ({ one }) => ({
  issue: one(issuesTable, {
    fields: [attachmentsTable.issue_id],
    references: [issuesTable.id],
  }),
  uploader: one(usersTable, {
    fields: [attachmentsTable.uploaded_by],
    references: [usersTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  projects: projectsTable,
  projectMembers: projectMembersTable,
  issues: issuesTable,
  comments: commentsTable,
  attachments: attachmentsTable,
};
