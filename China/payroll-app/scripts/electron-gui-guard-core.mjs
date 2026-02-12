function isTruthyFlag(value) {
  return value === "1" || value === "true";
}

export function evaluateElectronGuiPolicy(env, platform) {
  if (platform !== "darwin") {
    return { allowed: true };
  }

  const isCodexDesktop =
    isTruthyFlag(env.CODEX_CI) || env.CODEX_INTERNAL_ORIGINATOR_OVERRIDE === "Codex Desktop";
  const allowOverride = isTruthyFlag(env.ALLOW_ELECTRON_GUI_IN_CODEX);

  if (isCodexDesktop && !allowOverride) {
    return {
      allowed: false,
      reason:
        "Electron GUI launch is blocked in Codex on macOS. Run this command from a desktop terminal session, or set ALLOW_ELECTRON_GUI_IN_CODEX=1 to force launch.",
    };
  }

  return { allowed: true };
}
