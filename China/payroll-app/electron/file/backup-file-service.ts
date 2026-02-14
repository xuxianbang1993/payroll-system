import {
  dialog,
  type BrowserWindow,
  type OpenDialogOptions,
  type SaveDialogOptions,
} from "electron";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const FILE_SAFE_PATTERN = /[<>:"/\\|?*\u0000-\u001F]/g;
const DEFAULT_ORG_NAME = "公司名称";

export interface SaveBackupJsonOptions {
  ownerWindow?: BrowserWindow | null;
  payload: unknown;
  orgName?: string;
  suggestedPath?: string;
}

export interface SaveBackupJsonResult {
  canceled: boolean;
  filePath: string | null;
  bytesWritten: number;
}

export interface OpenBackupJsonOptions {
  ownerWindow?: BrowserWindow | null;
  selectedPath?: string;
}

export interface OpenBackupJsonResult {
  canceled: boolean;
  filePath: string | null;
  payload: unknown | null;
}

function toSafeOrgSegment(value: string | undefined): string {
  const source = (value ?? "").trim();
  const safe = (source === "" ? DEFAULT_ORG_NAME : source)
    .replace(FILE_SAFE_PATTERN, "_")
    .replace(/\s+/g, "_");

  return safe === "" ? DEFAULT_ORG_NAME : safe;
}

function withJsonExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase() === ".json" ? filePath : `${filePath}.json`;
}

function getDefaultBackupFileName(orgName: string | undefined): string {
  const date = new Date().toISOString().slice(0, 10);
  return `薪酬数据备份_${toSafeOrgSegment(orgName)}_${date}.json`;
}

export async function saveBackupJsonFile(
  options: SaveBackupJsonOptions,
): Promise<SaveBackupJsonResult> {
  let selectedPath = options.suggestedPath;

  if (!selectedPath) {
    const dialogOptions: SaveDialogOptions = {
      title: "保存备份文件",
      defaultPath: getDefaultBackupFileName(options.orgName),
      filters: [{ name: "JSON", extensions: ["json"] }],
      properties: ["createDirectory", "showOverwriteConfirmation"],
    };
    const saveResult = options.ownerWindow
      ? await dialog.showSaveDialog(options.ownerWindow, dialogOptions)
      : await dialog.showSaveDialog(dialogOptions);

    if (saveResult.canceled || !saveResult.filePath) {
      return {
        canceled: true,
        filePath: null,
        bytesWritten: 0,
      };
    }

    selectedPath = saveResult.filePath;
  }

  const targetPath = withJsonExtension(selectedPath);
  const content = JSON.stringify(options.payload ?? {}, null, 2);

  writeFileSync(targetPath, content, "utf8");

  return {
    canceled: false,
    filePath: targetPath,
    bytesWritten: Buffer.byteLength(content, "utf8"),
  };
}

export async function openBackupJsonFile(
  options: OpenBackupJsonOptions,
): Promise<OpenBackupJsonResult> {
  let selectedPath = options.selectedPath;

  if (!selectedPath) {
    const dialogOptions: OpenDialogOptions = {
      title: "选择备份文件",
      filters: [{ name: "JSON", extensions: ["json"] }],
      properties: ["openFile"],
    };
    const openResult = options.ownerWindow
      ? await dialog.showOpenDialog(options.ownerWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions);

    if (openResult.canceled || openResult.filePaths.length === 0) {
      return {
        canceled: true,
        filePath: null,
        payload: null,
      };
    }

    selectedPath = openResult.filePaths[0];
  }

  const raw = readFileSync(selectedPath, "utf8");

  try {
    return {
      canceled: false,
      filePath: selectedPath,
      payload: JSON.parse(raw),
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid backup JSON: ${detail}`);
  }
}
