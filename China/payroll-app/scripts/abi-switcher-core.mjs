export function parseAbiTarget(rawTarget) {
  if (rawTarget === "node" || rawTarget === "electron") {
    return rawTarget;
  }

  throw new Error(
    `Invalid ABI target: ${String(rawTarget)}. Expected "node" or "electron".`,
  );
}

export function shouldRebuild(options) {
  const markerTarget = options.markerTarget?.trim();
  if (!options.binaryExists) {
    return true;
  }

  return markerTarget !== options.target;
}

export function getRebuildCommand(target) {
  if (target === "node") {
    return {
      command: "npm",
      args: ["rebuild", "better-sqlite3"],
    };
  }

  return {
    command: "npx",
    args: ["@electron/rebuild", "-f", "-w", "better-sqlite3"],
  };
}
