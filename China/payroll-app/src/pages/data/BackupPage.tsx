import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackupActions } from "@/components/BackupActions";
import { RestoreActions } from "@/components/RestoreActions";
import {
  loadRepositoryStorageInfo,
  type RepositoryStorageInfo,
} from "@/lib/p1-repository";
import { formatBytes } from "@/utils/format";

export function BackupPage() {
  const { t } = useTranslation();
  const [busyAction, setBusyAction] = useState<"export" | "import" | "clear" | null>(null);
  const [storage, setStorage] = useState<RepositoryStorageInfo | null>(null);
  const [lastExportPath, setLastExportPath] = useState("");
  const [lastExportedAt, setLastExportedAt] = useState("");

  const refreshStorage = async () => {
    const info = await loadRepositoryStorageInfo();
    setStorage(info);
  };

  useEffect(() => {
    void refreshStorage();
  }, []);

  const handleLastExportUpdate = (path: string, exportedAt: string) => {
    setLastExportPath(path);
    setLastExportedAt(exportedAt);
  };

  return (
    <section className="grid gap-4">
      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <CardTitle>{t("data.backup.title")}</CardTitle>
          <CardDescription>{t("data.backup.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-medium">{t("data.backup.action.export")}</h3>
            <BackupActions
              busyAction={busyAction}
              onBusyChange={setBusyAction}
              onExportSuccess={refreshStorage}
              onLastExportUpdate={handleLastExportUpdate}
            />
            {lastExportPath ? (
              <div className="mt-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                <p>{t("data.backup.lastExport.path", { path: lastExportPath })}</p>
                <p>{t("data.backup.lastExport.time", { time: new Date(lastExportedAt).toLocaleString() })}</p>
              </div>
            ) : null}
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium">{t("data.backup.action.import")} / {t("data.backup.action.clear")}</h3>
            <RestoreActions
              busyAction={busyAction}
              onBusyChange={setBusyAction}
              onRestoreSuccess={refreshStorage}
            />
          </div>
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
