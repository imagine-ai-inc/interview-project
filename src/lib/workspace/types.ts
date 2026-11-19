import { z } from "zod";

export interface WorkspaceFileNode {
  type: "file";
  name: string;
  /** Relative to the workspace root, `/`-separated. */
  path: string;
  size: number;
  modifiedAt: string;
}

export interface WorkspaceDirectoryNode {
  type: "directory";
  name: string;
  path: string;
  children: WorkspaceNode[];
}

export type WorkspaceNode = WorkspaceFileNode | WorkspaceDirectoryNode;

const fileNodeSchema = z.object({
  type: z.literal("file"),
  name: z.string(),
  path: z.string(),
  size: z.number(),
  modifiedAt: z.string(),
});

export const workspaceNodeSchema: z.ZodType<WorkspaceNode> = z.lazy(() =>
  z.discriminatedUnion("type", [
    fileNodeSchema,
    z.object({
      type: z.literal("directory"),
      name: z.string(),
      path: z.string(),
      children: z.array(workspaceNodeSchema),
    }),
  ]),
);

export const workspaceTreeResponseSchema = z.object({
  tree: z.array(workspaceNodeSchema),
});

/** The URL that serves a workspace file's bytes. */
export function workspaceFileUrl(path: string) {
  return `/api/workspace/${path.split("/").map(encodeURIComponent).join("/")}`;
}
