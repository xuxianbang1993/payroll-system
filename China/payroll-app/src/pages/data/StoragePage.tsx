import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadDbRuntimeInfo, type DbRuntimeInfo } from "@/lib/db-admin";
import { loadRepositoryStorageInfo, type RepositoryStorageInfo } from "@/lib/p1-repository";

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function StoragePage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [storageInfo, setStorageInfo] = useState<RepositoryStorageInfo | null>(null);
  const [runtimeInfo, setRuntimeInfo] = useState<DbRuntimeInfo | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const [storage, runtime] = await Promise.all([
        loadRepositoryStorageInfo(),
        loadDbRuntimeInfo(),
      ]);
      setStorageInfo(storage);
      setRuntimeInfo(runtime);
    } catch (error) {
      setErrorMessage(t("data.storage.error.loadFailed", { reason: toErrorMessage(error) }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <section className="grid gap-4">
      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <CardTitle>{t("data.storage.title")}</CardTitle>
          <CardDescription>{t("data.storage.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => void loadData()} disabled={loading}>
              {loading ? t("data.storage.action.refreshing") : t("data.storage.action.refresh")}
            </Button>
          </div>

          {errorMessage ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid gap-2 text-muted-foreground sm:grid-cols-2">
            <p>{t("data.storage.metric.dbPath", { value: runtimeInfo?.dbPath ?? "-" })}</p>
            <p>{t("data.storage.metric.schema", { value: storageInfo?.schemaVersion ?? 0 })}</p>
            <p>{t("data.storage.metric.size", { value: formatBytes(storageInfo?.fileSizeBytes ?? 0) })}</p>
            <p>{t("data.storage.metric.appEnv", { value: runtimeInfo?.appEnv ?? "-" })}</p>
            <p>{t("data.storage.metric.readSource", { value: runtimeInfo?.readSource ?? "-" })}</p>
            <p>{t("data.storage.metric.writeMode", { value: runtimeInfo?.writeMode ?? "-" })}</p>
            <p>{t("data.storage.metric.journalMode", { value: runtimeInfo?.pragmas.journalMode ?? "-" })}</p>
            <p>{t("data.storage.metric.foreignKeys", { value: runtimeInfo?.pragmas.foreignKeys ?? 0 })}</p>
            <p>{t("data.storage.metric.employeeCount", { value: storageInfo?.employeeCount ?? 0 })}</p>
            <p>{t("data.storage.metric.companyCount", { value: storageInfo?.companyCount ?? 0 })}</p>
            <p>{t("data.storage.metric.payrollInputCount", { value: storageInfo?.payrollInputCount ?? 0 })}</p>
            <p>{t("data.storage.metric.payrollResultCount", { value: storageInfo?.payrollResultCount ?? 0 })}</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
