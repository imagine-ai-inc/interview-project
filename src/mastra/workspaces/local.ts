import {
  LocalFilesystem,
  LocalSandbox,
  Workspace,
  WORKSPACE_TOOLS,
} from "@mastra/core/workspace";
import { join } from "node:path";

/** Absolute, so `next dev`, `next start`, and tests all resolve the same directory. */
export const WORKSPACE_DIR = join(process.cwd(), "workspace");

/** Seatbelt on macOS, Bubblewrap on Linux; unisolated where neither exists. */
const isolation = LocalSandbox.detectIsolation();

export const localFilesystem = new LocalFilesystem({
  basePath: WORKSPACE_DIR,
});

export const localWorkspace = new Workspace({
  id: "local-workspace",
  name: "Local workspace",
  filesystem: localFilesystem,
  sandbox: new LocalSandbox({
    workingDirectory: WORKSPACE_DIR,
    isolation: isolation.available ? isolation.backend : "none",
    timeout: 60_000,
  }),
  tools: {
    [WORKSPACE_TOOLS.FILESYSTEM.READ_FILE]: {
      maxMediaBytes: 10 * 1024 * 1024,
    },
  },
});
