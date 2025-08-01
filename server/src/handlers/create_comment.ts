
import { type CreateCommentInput, type Comment } from '../schema';

export async function createComment(input: CreateCommentInput): Promise<Comment> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is adding a comment to an issue.
    // Should validate that the user has access to the project containing the issue.
    return Promise.resolve({
        id: 0,
        issue_id: input.issue_id,
        user_id: input.user_id,
        content: input.content,
        created_at: new Date(),
        updated_at: new Date()
    } as Comment);
}
