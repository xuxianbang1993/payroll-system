import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { saveBackupJsonFile } from "@/lib/p1-backup-files";
import { exportRepositoryBackup } from "@/lib/p1-repository";
import { toErrorMessage } from "@/utils/error";

type NoticeTone = "info" | "success" | "error";

interface NoticeState {
  tone: NoticeTone;
  message: string;
}

interface BackupActionsProps {
  busyAction: "export" | "import" | "clear" | null;
  onBusyChange: (action: "export" | "import" | "clear" | null) => void;
  onExportSuccess?: () => void;
  onLastExportUpdate?: (path: string, exportedAt: string) => void;
}

export function BackupActions({
  busyAction,
  onBusyChange,
  onExportSuccess,
  onLastExportUpdate,
}: BackupActionsProps) {
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

  const handleExport = async () => {
    onBusyChange("export");
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

      onLastExportUpdate?.(saved.filePath ?? "", backup.exportedAt);
      setNotice({
        tone: "success",
        message: t("data.backup.notice.exportSuccess", { path: saved.filePath }),
      });
      onExportSuccess?.();
    } catch (error) {
      setNotice({
        tone: "error",
        message: t("data.backup.notice.exportFailed", { reason: toErrorMessage(error) }),
      });
    } finally {
      onBusyChange(null);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleExport} disabled={busyAction !== null}>
        {busyAction === "export" ? t("data.backup.action.exporting") : t("data.backup.action.export")}
      </Button>

      {notice ? (
        <div className={cn("rounded-md border px-3 py-2 text-sm", noticeClassName)}>{notice.message}</div>
      ) : null}
    </div>
  );
}
