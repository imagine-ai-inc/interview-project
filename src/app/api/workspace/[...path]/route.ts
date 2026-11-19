import { NextResponse, type NextRequest } from "next/server";

import { readWorkspaceFile } from "@/lib/workspace/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/workspace/[...path]">,
) {
  const { path } = await context.params;
  try {
    const { bytes, contentType } = await readWorkspaceFile(path.join("/"));
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    // Missing files and paths the contained filesystem rejects both read as 404.
    console.warn(`[workspace] cannot read ${path.join("/")}`, error);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
