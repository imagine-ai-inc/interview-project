"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FILE_TOOL_NAMES } from "@/lib/agent/tool-labels";
import { cn } from "@/lib/cn";
import {
  workspaceFileUrl,
  workspaceTreeResponseSchema,
  type WorkspaceFileNode,
  type WorkspaceNode,
} from "@/lib/workspace/types";

import { PanelMessage } from "./panel-message";
import { useJsonResource, useTextResource } from "./use-resource";
import { useToolRevision } from "./use-tool-revision";

type PreviewKind = "pdf" | "image" | "text";

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp"]);

function previewKind(path: string): PreviewKind {
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  if (extension === "pdf") return "pdf";
  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  return "text";
}

function findFile(
  nodes: readonly WorkspaceNode[],
  path: string,
): WorkspaceFileNode | undefined {
  for (const node of nodes) {
    if (node.type === "file" && node.path === path) return node;
    if (node.type === "directory") {
      const found = findFile(node.children, path);
      if (found) return found;
    }
  }
  return undefined;
}

function TreeRows({
  nodes,
  depth,
  selectedPath,
  onSelect,
}: {
  nodes: readonly WorkspaceNode[];
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-px">
      {nodes.map((node) => (
        <li key={node.path}>
          {node.type === "directory" ? (
            <>
              <p
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                className="type-small text-imagine-foreground-muted flex h-7 items-center gap-2 font-medium"
              >
                <Icon name="folder" size="s" />
                {node.name}
              </p>
              <TreeRows
                nodes={node.children}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelect={onSelect}
              />
            </>
          ) : (
            <button
              type="button"
              onClick={() => onSelect(node.path)}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              aria-current={node.path === selectedPath ? "true" : undefined}
              className={cn(
                "type-small rounded-control flex h-7 w-full items-center gap-2 pr-2 text-left transition-colors",
                node.path === selectedPath
                  ? "bg-imagine-foreground/8 text-imagine-foreground"
                  : "text-imagine-foreground-muted hover:bg-imagine-foreground/5 hover:text-imagine-foreground",
              )}
            >
              <Icon name="file-lines" size="s" />
              <span className="truncate">{node.name}</span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function TextPreview({ url }: { url: string }) {
  const text = useTextResource(url);

  if (text.status === "error") {
    return <PanelMessage tone="error">{text.error}</PanelMessage>;
  }
  if (text.status === "loading") return <PanelMessage>Loading…</PanelMessage>;
  return (
    <pre className="type-small p-l font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
      {text.data}
    </pre>
  );
}

function FilePreview({ file }: { file: WorkspaceFileNode }) {
  // The modified time busts the browser's cache when the agent rewrites the file.
  const url = `${workspaceFileUrl(file.path)}?v=${encodeURIComponent(file.modifiedAt)}`;
  const kind = previewKind(file.path);

  return (
    <div className="border-imagine-border flex min-h-0 flex-1 flex-col border-t">
      <div className="px-l py-s flex items-center gap-2">
        <span className="type-small min-w-0 flex-1 truncate font-medium">
          {file.path}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="ghost" size="icon-xs">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open in a new tab"
              >
                <Icon name="up-right-from-square" size="s" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Open in a new tab</TooltipContent>
        </Tooltip>
      </div>
      <div className="bg-imagine-surface-raised min-h-0 flex-1 overflow-auto">
        {kind === "pdf" ? (
          <iframe src={url} title={file.name} className="h-full w-full" />
        ) : kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element -- workspace files are not static assets
          <img src={url} alt={file.name} className="p-l max-w-full" />
        ) : (
          <TextPreview url={url} />
        )}
      </div>
    </div>
  );
}

/** The workspace tree, with the picked file previewed under it. */
export function FilesPanel() {
  const revision = useToolRevision(FILE_TOOL_NAMES);
  const tree = useJsonResource("/api/workspace", workspaceTreeResponseSchema, revision);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  if (tree.data === undefined) {
    return tree.status === "error" ? (
      <PanelMessage tone="error">{tree.error}</PanelMessage>
    ) : (
      <PanelMessage>Loading files…</PanelMessage>
    );
  }

  const selected = selectedPath ? findFile(tree.data.tree, selectedPath) : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="p-s max-h-[45%] shrink-0 overflow-y-auto">
        {tree.data.tree.length === 0 ? (
          <PanelMessage>The workspace is empty.</PanelMessage>
        ) : (
          <TreeRows
            nodes={tree.data.tree}
            depth={0}
            selectedPath={selectedPath}
            onSelect={setSelectedPath}
          />
        )}
      </div>
      {selected ? (
        <FilePreview file={selected} />
      ) : (
        <PanelMessage>Pick a file to preview it.</PanelMessage>
      )}
    </div>
  );
}
