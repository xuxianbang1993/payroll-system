import type { EmployeeImportRow } from "@/types/payroll";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import type { EmployeeImportConflict } from "@/lib/employee-import-merge";

interface ImportPreviewProps {
  selectedFileName: string;
  importRows: EmployeeImportRow[];
  parseErrors: string[];
  conflicts: EmployeeImportConflict[];
  canApplyImport: boolean;
  saving: boolean;
  hasUnresolvedConflicts: boolean;
  onTemplateDownload: () => void;
  onFileSelect: (file: File) => void;
  onApplyImport: () => void;
  onResolveConflicts: () => void;
}

export function ImportPreview({
  selectedFileName,
  importRows,
  parseErrors,
  conflicts,
  canApplyImport,
  saving,
  hasUnresolvedConflicts,
  onTemplateDownload,
  onFileSelect,
  onApplyImport,
  onResolveConflicts,
}: ImportPreviewProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onTemplateDownload}>
          {t("employee.importExport.action.downloadTemplate")}
        </Button>

        <label className="inline-flex cursor-pointer items-center">
          <input
            type="file"
            className="hidden"
            accept=".xlsx,.xls"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onFileSelect(file);
              }
              event.target.value = "";
            }}
          />
          <span className="inline-flex h-9 items-center rounded-md border px-3 text-sm">
            {t("employee.importExport.action.chooseFile")}
          </span>
        </label>

        <Button onClick={onApplyImport} disabled={!canApplyImport}>
          {saving ? t("common.saving") : t("employee.importExport.action.applyImport")}
        </Button>

        {hasUnresolvedConflicts ? (
          <Button variant="outline" onClick={onResolveConflicts} disabled={saving}>
            {t("employee.importExport.action.resolveConflicts")}
          </Button>
        ) : null}
      </div>

      <p className="text-sm text-muted-foreground">
        {selectedFileName
          ? t("employee.importExport.file.selected", { name: selectedFileName })
          : t("employee.importExport.file.empty")}
      </p>

      {parseErrors.length > 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {parseErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        <p>{t("employee.importExport.summary.rows", { count: importRows.length })}</p>
        <p>{t("employee.importExport.summary.conflicts", { count: conflicts.length })}</p>
      </div>

      {hasUnresolvedConflicts ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t("employee.importExport.notice.conflictsPending")}
        </div>
      ) : null}
    </div>
  );
}
