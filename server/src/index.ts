
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createUserInputSchema,
  createProjectInputSchema,
  inviteUserToProjectInputSchema,
  createIssueInputSchema,
  updateIssueInputSchema,
  createCommentInputSchema,
  createAttachmentInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { createProject } from './handlers/create_project';
import { getProjects } from './handlers/get_projects';
import { getUserProjects } from './handlers/get_user_projects';
import { inviteUserToProject } from './handlers/invite_user_to_project';
import { getProjectMembers } from './handlers/get_project_members';
import { createIssue } from './handlers/create_issue';
import { updateIssue } from './handlers/update_issue';
import { getProjectIssues } from './handlers/get_project_issues';
import { getIssue } from './handlers/get_issue';
import { createComment } from './handlers/create_comment';
import { getIssueComments } from './handlers/get_issue_comments';
import { createAttachment } from './handlers/create_attachment';
import { getIssueAttachments } from './handlers/get_issue_attachments';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  getUsers: publicProcedure
    .query(() => getUsers()),

  // Project routes
  createProject: publicProcedure
    .input(createProjectInputSchema)
    .mutation(({ input }) => createProject(input)),
  getProjects: publicProcedure
    .query(() => getProjects()),
  getUserProjects: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserProjects(input.userId)),

  // Project member routes
  inviteUserToProject: publicProcedure
    .input(inviteUserToProjectInputSchema)
    .mutation(({ input }) => inviteUserToProject(input)),
  getProjectMembers: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => getProjectMembers(input.projectId)),

  // Issue routes
  createIssue: publicProcedure
    .input(createIssueInputSchema)
    .mutation(({ input }) => createIssue(input)),
  updateIssue: publicProcedure
    .input(updateIssueInputSchema)
    .mutation(({ input }) => updateIssue(input)),
  getProjectIssues: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => getProjectIssues(input.projectId)),
  getIssue: publicProcedure
    .input(z.object({ issueId: z.number() }))
    .query(({ input }) => getIssue(input.issueId)),

  // Comment routes
  createComment: publicProcedure
    .input(createCommentInputSchema)
    .mutation(({ input }) => createComment(input)),
  getIssueComments: publicProcedure
    .input(z.object({ issueId: z.number() }))
    .query(({ input }) => getIssueComments(input.issueId)),

  // Attachment routes
  createAttachment: publicProcedure
    .input(createAttachmentInputSchema)
    .mutation(({ input }) => createAttachment(input)),
  getIssueAttachments: publicProcedure
    .input(z.object({ issueId: z.number() }))
    .query(({ input }) => getIssueAttachments(input.issueId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
