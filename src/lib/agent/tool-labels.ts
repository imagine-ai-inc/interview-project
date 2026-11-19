import type { IconName } from "@/components/ui/icon";

/**
 * How the agent's tool calls read to a person, as in v2. Titles stay
 * non-technical; the user can expand a row for the arguments and result.
 */
interface ToolLabel {
  icon: IconName;
  title: string;
  /** Several calls in a row; `{n}` is the count. */
  many: string;
  /** Arg whose text is quoted after the title, e.g. a skill name. */
  arg?: string;
}

const TOOLS: Readonly<Record<string, ToolLabel>> = {
  list_posts: { icon: "calendar", title: "Listed posts", many: "Listed posts {n} times" },
  read_post: { icon: "file-lines", title: "Read a post", many: "Read {n} posts" },
  create_post: { icon: "file-plus", title: "Created a post", many: "Created {n} posts" },
  update_post: { icon: "file-pen", title: "Updated a post", many: "Updated {n} posts" },
  delete_post: { icon: "trash", title: "Deleted a post", many: "Deleted {n} posts" },
  mastra_workspace_read_file: { icon: "file-lines", title: "Read a file", many: "Read {n} files" },
  mastra_workspace_file_stat: { icon: "file-lines", title: "Checked a file", many: "Checked {n} files" },
  mastra_workspace_list_files: { icon: "folder-open", title: "Listed a folder", many: "Listed {n} folders" },
  mastra_workspace_grep: { icon: "magnifying-glass", title: "Searched files", many: "Searched files {n} times" },
  mastra_workspace_write_file: { icon: "file-plus", title: "Wrote a file", many: "Wrote {n} files" },
  mastra_workspace_edit_file: { icon: "file-pen", title: "Edited a file", many: "Edited {n} files" },
  mastra_workspace_delete: { icon: "trash", title: "Deleted a file", many: "Deleted {n} files" },
  mastra_workspace_mkdir: { icon: "folder-plus", title: "Created a folder", many: "Created {n} folders" },
  mastra_workspace_execute_command: { icon: "terminal", title: "Ran a command", many: "Ran {n} commands" },
  mastra_workspace_get_process_output: { icon: "terminal", title: "Checked a command", many: "Checked {n} commands" },
  mastra_workspace_kill_process: { icon: "terminal", title: "Stopped a command", many: "Stopped {n} commands" },
  skill: { icon: "puzzle-piece", title: "Used a skill", many: "Used {n} skills", arg: "name" },
  skill_read: { icon: "puzzle-piece", title: "Read a skill", many: "Read {n} skill files", arg: "skillName" },
  skill_search: { icon: "magnifying-glass", title: "Searched skills", many: "Searched skills {n} times", arg: "query" },
};

/** Tools whose results change what the right side shows. */
export const POST_TOOL_NAMES = new Set([
  "create_post",
  "update_post",
  "delete_post",
]);

export const FILE_TOOL_NAMES = new Set([
  "mastra_workspace_write_file",
  "mastra_workspace_edit_file",
  "mastra_workspace_delete",
  "mastra_workspace_mkdir",
  "mastra_workspace_execute_command",
]);

function labelFor(toolName: string): ToolLabel {
  const name = toolName
    .replace(/^mastra_workspace_/, "")
    .replace(/[_-]+/g, " ")
    .toLowerCase();
  return (
    TOOLS[toolName] ?? {
      icon: "plug",
      title: `Used ${name}`,
      many: `Used ${name} {n} times`,
    }
  );
}

function quotedArg(label: ToolLabel, args: unknown): string {
  if (!label.arg || typeof args !== "object" || args === null) return "";
  const value: unknown = (args as Record<string, unknown>)[label.arg];
  return typeof value === "string" ? value.trim() : "";
}

/** One call, e.g. `{ icon: "puzzle-piece", title: "Used a skill: “pdf”" }`. */
export function describeTool(toolName: string, args: unknown) {
  const label = labelFor(toolName);
  const quoted = quotedArg(label, args);
  return {
    icon: label.icon,
    title: quoted ? `${label.title}: “${quoted}”` : label.title,
  };
}

/** Calls made in a row, counted per tool in first-seen order, e.g. “Ran 2 commands, wrote a file”. */
export function describeTools(
  calls: readonly { toolName: string; args: unknown }[],
) {
  const argsByTool = new Map<string, unknown[]>();
  for (const { toolName, args } of calls) {
    argsByTool.set(toolName, [...(argsByTool.get(toolName) ?? []), args]);
  }
  return [...argsByTool]
    .map(([toolName, argsList]) =>
      argsList.length === 1
        ? describeTool(toolName, argsList[0]).title
        : labelFor(toolName).many.replace("{n}", String(argsList.length)),
    )
    .map((phrase, index) =>
      index === 0 ? phrase : phrase.charAt(0).toLowerCase() + phrase.slice(1),
    )
    .join(", ");
}
