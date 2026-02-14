import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  buildEmployeeWorkbook,
  createEmployeeTemplateWorkbook,
  findEmployeeImportConflicts,
  mergeEmployeeImportRows,
  parseEmployeeWorkbook,
  type EmployeeImportConflict,
} from "@/lib/p1-employee-import-export";
import { useEmployeeStore } from "@/stores/employee-store";
import type { EmployeeImportRow } from "@/types/payroll";

interface ImportExportPageProps {
  defaultTab?: "import" | "export";
}

type ConflictDecision = "overwrite" | "skip";

function downloadBytes(bytes: Uint8Array, filename: string): void {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);

  const blob = new Blob([copy], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ImportExportPage({ defaultTab = "import" }: ImportExportPageProps) {
  const { t } = useTranslation();
  const {
    employees,
    load,
    replaceAll,
    loading,
    saving,
    errorMessage,
    noticeMessage,
  } = useEmployeeStore();

  const [activeTab, setActiveTab] = useState<"import" | "export">(defaultTab);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [importRows, setImportRows] = useState<EmployeeImportRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importMessage, setImportMessage] = useState("");
  const [conflicts, setConflicts] = useState<EmployeeImportConflict[]>([]);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [decisions, setDecisions] = useState<Record<number, ConflictDecision>>({});

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const hasUnresolvedConflicts = conflicts.length > 0;
  const canApplyImport = useMemo(
    () => importRows.length > 0 && !saving && !hasUnresolvedConflicts,
    [hasUnresolvedConflicts, importRows.length, saving],
  );

  const applyImport = async (rows: EmployeeImportRow[], decisionMap: Record<number, ConflictDecision>) => {
    const merged = mergeEmployeeImportRows(employees, rows, (conflict) => {
      return decisionMap[conflict.row.rowNumber] ?? "overwrite";
    });

    const ok = await replaceAll(
      merged.employees,
      t("employee.importExport.notice.importApplied", {
        inserted: merged.summary.inserted,
        overwritten: merged.summary.overwritten,
        skipped: merged.summary.skipped,
      }),
    );

    if (!ok) {
      return;
    }

    setImportMessage(
      t("employee.importExport.notice.importApplied", {
        inserted: merged.summary.inserted,
        overwritten: merged.summary.overwritten,
        skipped: merged.summary.skipped,
      }),
    );
    setImportRows([]);
    setConflicts([]);
    setConflictDialogOpen(false);
    setDecisions({});
  };

  const handleImportFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const parsed = parseEmployeeWorkbook(buffer);

    setSelectedFileName(file.name);
    setParseErrors(parsed.errors);
    setImportRows(parsed.rows);
    setImportMessage("");

    if (parsed.rows.length === 0) {
      setConflicts([]);
      setConflictDialogOpen(false);
      return;
    }

    const conflictResult = findEmployeeImportConflicts(employees, parsed.rows);
    setConflicts(conflictResult.conflicts);
    if (conflictResult.conflicts.length > 0) {
      const initialDecisionMap = conflictResult.conflicts.reduce<Record<number, ConflictDecision>>((acc, conflict) => {
        acc[conflict.row.rowNumber] = "overwrite";
        return acc;
      }, {});
      setDecisions(initialDecisionMap);
      setConflictDialogOpen(true);
    }
  };

  const handleTemplateDownload = () => {
    const bytes = createEmployeeTemplateWorkbook();
    downloadBytes(bytes, "employee-import-template.xlsx");
  };

  const handleEmployeeExport = () => {
    const bytes = buildEmployeeWorkbook(employees);
    downloadBytes(bytes, "employee-list.xlsx");
  };

  return (
    <section className="grid gap-4">
      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <CardTitle>{t("employee.importExport.title")}</CardTitle>
          <CardDescription>{t("employee.importExport.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {errorMessage}
            </div>
          ) : null}

          {!errorMessage && noticeMessage ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {noticeMessage}
            </div>
          ) : null}

          {!errorMessage && importMessage ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {importMessage}
            </div>
          ) : null}

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "import" | "export")}>
            <TabsList>
              <TabsTrigger value="import">{t("employee.importExport.tab.import")}</TabsTrigger>
              <TabsTrigger value="export">{t("employee.importExport.tab.export")}</TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleTemplateDownload}>
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
                        void handleImportFile(file);
                      }
                      event.target.value = "";
                    }}
                  />
                  <span className="inline-flex h-9 items-center rounded-md border px-3 text-sm">
                    {t("employee.importExport.action.chooseFile")}
                  </span>
                </label>

                <Button onClick={() => void applyImport(importRows, decisions)} disabled={!canApplyImport}>
                  {saving ? t("common.saving") : t("employee.importExport.action.applyImport")}
                </Button>

                {hasUnresolvedConflicts ? (
                  <Button variant="outline" onClick={() => setConflictDialogOpen(true)} disabled={saving}>
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
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("employee.importExport.export.summary", { count: employees.length })}
              </p>
              <Button onClick={handleEmployeeExport} disabled={loading || saving}>
                {t("employee.importExport.action.exportEmployees")}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("employee.importExport.conflict.title")}</DialogTitle>
            <DialogDescription>{t("employee.importExport.conflict.description")}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const allOverwrite = conflicts.reduce<Record<number, ConflictDecision>>((acc, conflict) => {
                  acc[conflict.row.rowNumber] = "overwrite";
                  return acc;
                }, {});
                setDecisions(allOverwrite);
              }}
            >
              {t("employee.importExport.conflict.allOverwrite")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const allSkip = conflicts.reduce<Record<number, ConflictDecision>>((acc, conflict) => {
                  acc[conflict.row.rowNumber] = "skip";
                  return acc;
                }, {});
                setDecisions(allSkip);
              }}
            >
              {t("employee.importExport.conflict.allSkip")}
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("employee.importExport.conflict.table.row")}</TableHead>
                <TableHead>{t("employee.importExport.conflict.table.employee")}</TableHead>
                <TableHead>{t("employee.importExport.conflict.table.existing")}</TableHead>
                <TableHead>{t("employee.importExport.conflict.table.action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conflicts.map((conflict) => (
                <TableRow key={conflict.row.rowNumber}>
                  <TableCell>{conflict.row.rowNumber}</TableCell>
                  <TableCell>
                    {conflict.row.name} / {conflict.row.idCard || "-"}
                  </TableCell>
                  <TableCell>
                    {conflict.existing.name} / {conflict.existing.position}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={decisions[conflict.row.rowNumber] ?? "overwrite"}
                      onValueChange={(value) => {
                        setDecisions((prev) => ({
                          ...prev,
                          [conflict.row.rowNumber]: value as ConflictDecision,
                        }));
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overwrite">{t("employee.importExport.conflict.overwrite")}</SelectItem>
                        <SelectItem value="skip">{t("employee.importExport.conflict.skip")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConflictDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => void applyImport(importRows, decisions)} disabled={saving}>
              {saving ? t("common.saving") : t("employee.importExport.conflict.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
