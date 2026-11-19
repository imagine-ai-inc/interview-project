import { NextResponse } from "next/server";

import { listWorkspaceTree } from "@/lib/workspace/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ tree: await listWorkspaceTree() });
}
