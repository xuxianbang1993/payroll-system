import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { openBackupJsonFile } from "@/lib/p1-backup-files";
import { clearRepositoryData, importRepositoryBackup } from "@/lib/p1-repository";
import { toErrorMessage } from "@/utils/error";
import { asRecord } from "@/utils/type-guards";

type NoticeTone = "info" | "success" | "error";

interface NoticeState {
  tone: NoticeTone;
  message: string;
}

interface RestoreActionsProps {
  busyAction: "export" | "import" | "clear" | null;
  onBusyChange: (action: "export" | "import" | "clear" | null) => void;
  onRestoreSuccess?: () => void;
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

export function RestoreActions({
  busyAction,
  onBusyChange,
  onRestoreSuccess,
}: RestoreActionsProps) {
  const { t } = useTranslation();
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const noticeClassName = (() => {
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
  })();

  const handleImport = async () => {
    onBusyChange("import");
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
      onRestoreSuccess?.();
    } catch (error) {
      setNotice({
        tone: "error",
        message: t("data.backup.notice.importFailed", { reason: toErrorMessage(error) }),
      });
    } finally {
      onBusyChange(null);
    }
  };

  const handleClear = async () => {
    onBusyChange("clear");
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
      onRestoreSuccess?.();
    } catch (error) {
      setNotice({
        tone: "error",
        message: t("data.backup.notice.clearFailed", { reason: toErrorMessage(error) }),
      });
    } finally {
      onBusyChange(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
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
    </div>
  );
}
