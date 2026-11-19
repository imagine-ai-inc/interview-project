import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("file");

  const workspaceRoot = path.join(process.cwd(), "workspace");

  if (filePath) {
    const fullPath = path.join(workspaceRoot, filePath);
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    const content = fs.readFileSync(fullPath, "utf-8");
    return NextResponse.json({ filePath, content });
  }

  // List all files
  function walk(dir: string, base = ""): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const full = path.join(dir, file);
      const rel = path.join(base, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        results = results.concat(walk(full, rel));
      } else {
        results.push(rel);
      }
    }
    return results;
  }

  return NextResponse.json({
    files: walk(workspaceRoot),
  });
}
