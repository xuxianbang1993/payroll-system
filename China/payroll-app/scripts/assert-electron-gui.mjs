import { evaluateElectronGuiPolicy } from "./electron-gui-guard-core.mjs";

function run() {
  const result = evaluateElectronGuiPolicy(process.env, process.platform);
  if (result.allowed) {
    return;
  }

  console.error(`[electron-guard] ${result.reason}`);
  process.exit(1);
}

run();
