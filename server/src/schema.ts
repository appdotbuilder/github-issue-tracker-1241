
import { z } from 'zod';

// Enums
export const userRoleSchema = z.enum(['view', 'edit']);
export const issuePrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const issueStatusSchema = z.enum(['open', 'in_progress', 'closed', 'resolved']);

export type UserRole = z.infer<typeof userRoleSchema>;
export type IssuePriority = z.infer<typeof issuePrioritySchema>;
export type IssueStatus = z.infer<typeof issueStatusSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  github_username: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Project schema
export const projectSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  github_repo_url: z.string(),
  github_repo_name: z.string(),
  github_owner: z.string(),
  created_by: z.number(),
  created_at: z.coerce.date()
});

export type Project = z.infer<typeof projectSchema>;

// Project member schema
export const projectMemberSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  user_id: z.number(),
  role: userRoleSchema,
  invited_at: z.coerce.date()
});

export type ProjectMember = z.infer<typeof projectMemberSchema>;

// Issue schema
export const issueSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  priority: issuePrioritySchema,
  status: issueStatusSchema,
  assigned_to: z.number().nullable(),
  created_by: z.number(),
  due_date: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Issue = z.infer<typeof issueSchema>;

// Comment schema
export const commentSchema = z.object({
  id: z.number(),
  issue_id: z.number(),
  user_id: z.number(),
  content: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Comment = z.infer<typeof commentSchema>;

// Attachment schema
export const attachmentSchema = z.object({
  id: z.number(),
  issue_id: z.number(),
  filename: z.string(),
  file_url: z.string(),
  file_size: z.number(),
  mime_type: z.string(),
  uploaded_by: z.number(),
  uploaded_at: z.coerce.date()
});

export type Attachment = z.infer<typeof attachmentSchema>;

// Input schemas
export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  github_username: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createProjectInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  github_repo_url: z.string().url(),
  github_repo_name: z.string(),
  github_owner: z.string(),
  created_by: z.number()
});

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

export const inviteUserToProjectInputSchema = z.object({
  project_id: z.number(),
  user_id: z.number(),
  role: userRoleSchema
});

export type InviteUserToProjectInput = z.infer<typeof inviteUserToProjectInputSchema>;

export const createIssueInputSchema = z.object({
  project_id: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  priority: issuePrioritySchema,
  status: issueStatusSchema.default('open'),
  assigned_to: z.number().nullable().optional(),
  created_by: z.number(),
  due_date: z.coerce.date().nullable().optional()
});

export type CreateIssueInput = z.infer<typeof createIssueInputSchema>;

export const updateIssueInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  priority: issuePrioritySchema.optional(),
  status: issueStatusSchema.optional(),
  assigned_to: z.number().nullable().optional(),
  due_date: z.coerce.date().nullable().optional()
});

export type UpdateIssueInput = z.infer<typeof updateIssueInputSchema>;

export const createCommentInputSchema = z.object({
  issue_id: z.number(),
  user_id: z.number(),
  content: z.string()
});

export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;

export const createAttachmentInputSchema = z.object({
  issue_id: z.number(),
  filename: z.string(),
  file_url: z.string(),
  file_size: z.number(),
  mime_type: z.string(),
  uploaded_by: z.number()
});

export type CreateAttachmentInput = z.infer<typeof createAttachmentInputSchema>;
