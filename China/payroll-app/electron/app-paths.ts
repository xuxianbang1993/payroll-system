import { existsSync } from "node:fs";
import path from "node:path";

interface ResolveRendererIndexPathOptions {
  cwd?: string;
}

export function resolveRendererIndexPath(
  moduleDir: string,
  options: ResolveRendererIndexPathOptions = {},
): string {
  const cwd = options.cwd ?? process.cwd();
  const candidates = [
    path.join(moduleDir, "../dist/index.html"),
    path.join(moduleDir, "../../dist/index.html"),
    path.join(cwd, "dist/index.html"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Cannot resolve renderer index path. Tried: ${candidates.join(", ")}`);
}
