import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { openBackupJsonFile, saveBackupJsonFile } from "@/lib/p1-backup-files";
import {
  clearRepositoryData,
  exportRepositoryBackup,
  importRepositoryBackup,
  loadRepositoryStorageInfo,
  type RepositoryStorageInfo,
} from "@/lib/p1-repository";

type NoticeTone = "info" | "success" | "error";

interface NoticeState {
  tone: NoticeTone;
  message: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readBackupSummary(payload: unknown): { orgName: string; employeeCount: number; companyCount: number } {
  const root = asRecord(payload);
  const body = asRecord(root?.data) ?? root ?? {};
  const orgName = typeof body.orgName === "string" ? body.orgName.trim() : "";
  const employeeCount = Array.isArray(body.employees) ? body.employees.length : 0;
  const companyCount = Array.isArray(body.companies) ? body.companies.length : 0;

  return {
    orgName,
    employeeCount,
    companyCount,
  };
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function BackupPage() {
  const { t } = useTranslation();

  const [busyAction, setBusyAction] = useState<"export" | "import" | "clear" | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [storage, setStorage] = useState<RepositoryStorageInfo | null>(null);
  const [lastExportPath, setLastExportPath] = useState<string>("");
  const [lastExportedAt, setLastExportedAt] = useState<string>("");

  const noticeClassName = useMemo(() => {
    if (!notice) {
      return "";
    }

    if (notice.tone === "success") {
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    }
    if (notice.tone === "error") {
      return "border-rose-200 bg-rose-50 text-rose-800";
    }

    return "border-border bg-muted text-muted-foreground";
  }, [notice]);

  const refreshStorage = async () => {
    const info = await loadRepositoryStorageInfo();
    setStorage(info);
  };

  useEffect(() => {
    void refreshStorage();
  }, []);

  const handleExport = async () => {
    setBusyAction("export");
    setNotice(null);

    try {
      const backup = await exportRepositoryBackup();
      if (!backup) {
        throw new Error(t("data.backup.notice.repositoryUnavailable"));
      }

      const saved = await saveBackupJsonFile({
        orgName: backup.data.orgName,
        payload: backup,
      });
      if (!saved) {
        throw new Error(t("data.backup.notice.fileBridgeUnavailable"));
      }
      if (saved.canceled) {
        setNotice({ tone: "info", message: t("data.backup.notice.saveCanceled") });
        return;
      }

      setLastExportPath(saved.filePath ?? "");
      setLastExportedAt(backup.exportedAt);
      setNotice({
        tone: "success",
        message: t("data.backup.notice.exportSuccess", { path: saved.filePath }),
      });
      await refreshStorage();
    } catch (error) {
      setNotice({
        tone: "error",
        message: t("data.backup.notice.exportFailed", { reason: toErrorMessage(error) }),
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleImport = async () => {
    setBusyAction("import");
    setNotice(null);

    try {
      const opened = await openBackupJsonFile();
      if (!opened) {
        throw new Error(t("data.backup.notice.fileBridgeUnavailable"));
      }
      if (opened.canceled || !opened.payload) {
        setNotice({ tone: "info", message: t("data.backup.notice.openCanceled") });
        return;
      }

      const summary = readBackupSummary(opened.payload);
      const confirmMessage = t("data.backup.dialog.importConfirm", {
        orgName: summary.orgName || t("data.backup.defaultOrgName"),
        employees: summary.employeeCount,
        companies: summary.companyCount,
      });

      if (!window.confirm(confirmMessage)) {
        setNotice({ tone: "info", message: t("data.backup.notice.importCanceled") });
        return;
      }

      const result = await importRepositoryBackup(opened.payload);
      if (!result) {
        throw new Error(t("data.backup.notice.repositoryUnavailable"));
      }

      setNotice({
        tone: "success",
        message: t("data.backup.notice.importSuccess", {
          employees: result.importedEmployees,
          companies: result.importedCompanies,
        }),
      });
      await refreshStorage();
    } catch (error) {
      setNotice({
        tone: "error",
        message: t("data.backup.notice.importFailed", { reason: toErrorMessage(error) }),
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleClear = async () => {
    setBusyAction("clear");
    setNotice(null);

    try {
      if (!window.confirm(t("data.backup.dialog.clearStepOne"))) {
        setNotice({ tone: "info", message: t("data.backup.notice.clearCanceled") });
        return;
      }
      if (!window.confirm(t("data.backup.dialog.clearStepTwo"))) {
        setNotice({ tone: "info", message: t("data.backup.notice.clearCanceled") });
        return;
      }

      const result = await clearRepositoryData();
      if (!result) {
        throw new Error(t("data.backup.notice.repositoryUnavailable"));
      }

      setNotice({
        tone: "success",
        message: t("data.backup.notice.clearSuccess", { tables: result.clearedTables.length }),
      });
      await refreshStorage();
    } catch (error) {
      setNotice({
        tone: "error",
        message: t("data.backup.notice.clearFailed", { reason: toErrorMessage(error) }),
      });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <section className="grid gap-4">
      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <CardTitle>{t("data.backup.title")}</CardTitle>
          <CardDescription>{t("data.backup.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleExport} disabled={busyAction !== null}>
              {busyAction === "export" ? t("data.backup.action.exporting") : t("data.backup.action.export")}
            </Button>
            <Button variant="secondary" onClick={handleImport} disabled={busyAction !== null}>
              {busyAction === "import" ? t("data.backup.action.importing") : t("data.backup.action.import")}
            </Button>
            <Button variant="destructive" onClick={handleClear} disabled={busyAction !== null}>
              {busyAction === "clear" ? t("data.backup.action.clearing") : t("data.backup.action.clear")}
            </Button>
          </div>

          {notice ? (
            <div className={cn("rounded-md border px-3 py-2 text-sm", noticeClassName)}>{notice.message}</div>
          ) : null}

          {lastExportPath ? (
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              <p>{t("data.backup.lastExport.path", { path: lastExportPath })}</p>
              <p>{t("data.backup.lastExport.time", { time: new Date(lastExportedAt).toLocaleString() })}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <CardTitle>{t("data.backup.snapshot.title")}</CardTitle>
          <CardDescription>{t("data.backup.snapshot.description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <p>{t("data.backup.snapshot.employeeCount", { count: storage?.employeeCount ?? 0 })}</p>
          <p>{t("data.backup.snapshot.companyCount", { count: storage?.companyCount ?? 0 })}</p>
          <p>{t("data.backup.snapshot.inputCount", { count: storage?.payrollInputCount ?? 0 })}</p>
          <p>{t("data.backup.snapshot.resultCount", { count: storage?.payrollResultCount ?? 0 })}</p>
          <p>{t("data.backup.snapshot.schemaVersion", { version: storage?.schemaVersion ?? 0 })}</p>
          <p>{t("data.backup.snapshot.fileSize", { size: formatBytes(storage?.fileSizeBytes ?? 0) })}</p>
        </CardContent>
      </Card>
    </section>
  );
}
