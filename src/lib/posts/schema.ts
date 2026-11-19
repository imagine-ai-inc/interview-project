import { z } from "zod";

export const POST_CHANNELS = ["linkedin", "x"] as const;
export const POST_STATUSES = [
  "draft",
  "planned",
  "scheduled",
  "published",
] as const;

export const postChannelSchema = z.enum(POST_CHANNELS);
export const postStatusSchema = z.enum(POST_STATUSES);

export type PostChannel = z.infer<typeof postChannelSchema>;
export type PostStatus = z.infer<typeof postStatusSchema>;

export const postSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  channel: postChannelSchema,
  status: postStatusSchema,
  scheduledAt: z.string().nullable(),
  tags: z.array(z.string()),
  authorName: z.string(),
  authorHandle: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Post = z.infer<typeof postSchema>;

const editableFields = {
  title: z.string().min(1).describe("Short internal title for the post"),
  content: z.string().min(1).describe("The full post body, as published"),
  channel: postChannelSchema,
  status: postStatusSchema,
  scheduledAt: z.iso
    .datetime()
    .nullable()
    .describe("ISO 8601 publish time; required when status is scheduled"),
  tags: z.array(z.string()).describe("Hashtags, e.g. #B2BGrowth"),
};

export const createPostInputSchema = z.object({
  ...editableFields,
  channel: editableFields.channel.default("linkedin"),
  status: editableFields.status.default("draft"),
  scheduledAt: editableFields.scheduledAt.default(null),
  tags: editableFields.tags.default([]),
});

export type CreatePostInput = z.input<typeof createPostInputSchema>;

export const updatePostInputSchema = z
  .object(editableFields)
  .partial()
  .extend({ id: z.string().describe("The post id, e.g. post_1") });

export type UpdatePostInput = z.input<typeof updatePostInputSchema>;

export const listPostsInputSchema = z.object({
  status: postStatusSchema.optional(),
  channel: postChannelSchema.optional(),
});

export type ListPostsInput = z.input<typeof listPostsInputSchema>;
