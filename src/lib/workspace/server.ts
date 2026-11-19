import { extname } from "node:path";

import { localFilesystem } from "@/mastra/workspaces/local";

import type { WorkspaceNode } from "./types";

const HIDDEN = new Set(["node_modules", ".DS_Store"]);

const CONTENT_TYPES: Record<string, string> = {
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".html": "text/plain; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const joinPath = (dir: string, name: string) =>
  dir === "." ? name : `${dir}/${name}`;

/** The workspace as a tree, directories first, through the contained filesystem. */
export async function listWorkspaceTree(dir = "."): Promise<WorkspaceNode[]> {
  const entries = await localFilesystem.readdir(dir);
  const nodes = await Promise.all(
    entries
      .filter((entry) => !HIDDEN.has(entry.name))
      .map(async (entry): Promise<WorkspaceNode> => {
        const path = joinPath(dir, entry.name);
        if (entry.type === "directory") {
          return {
            type: "directory",
            name: entry.name,
            path,
            children: await listWorkspaceTree(path),
          };
        }
        const stat = await localFilesystem.stat(path);
        return {
          type: "file",
          name: entry.name,
          path,
          size: stat.size,
          modifiedAt: stat.modifiedAt.toISOString(),
        };
      }),
  );
  return nodes.sort(
    (a, b) =>
      Number(b.type === "directory") - Number(a.type === "directory") ||
      a.name.localeCompare(b.name),
  );
}

export async function readWorkspaceFile(path: string) {
  const content = await localFilesystem.readFile(path);
  const bytes = typeof content === "string" ? Buffer.from(content) : content;
  const contentType =
    CONTENT_TYPES[extname(path).toLowerCase()] ?? "application/octet-stream";
  return { bytes, contentType };
}
