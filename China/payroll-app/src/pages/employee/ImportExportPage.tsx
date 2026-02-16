import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportPanel } from "@/components/ExportPanel";
import { ImportPreview } from "@/components/ImportPreview";
import { type ConflictDecision, type EmployeeImportConflict, findEmployeeImportConflicts, mergeEmployeeImportRows } from "@/lib/employee-import-merge";
import { buildEmployeeWorkbook, createEmployeeTemplateWorkbook, parseEmployeeWorkbook } from "@/lib/employee-import-parse";
import { useEmployeeStore } from "@/stores/employee-store";
import type { EmployeeImportRow } from "@/types/payroll";

interface ImportExportPageProps {
  defaultTab?: "import" | "export";
}

function downloadBytes(bytes: Uint8Array, filename: string): void {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ImportExportPage({ defaultTab = "import" }: ImportExportPageProps) {
  const { t } = useTranslation();
  const { employees, load, replaceAll, loading, saving, errorMessage, noticeMessage } = useEmployeeStore();

  const [activeTab, setActiveTab] = useState<"import" | "export">(defaultTab);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [importRows, setImportRows] = useState<EmployeeImportRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importMessage, setImportMessage] = useState("");
  const [conflicts, setConflicts] = useState<EmployeeImportConflict[]>([]);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [decisions, setDecisions] = useState<Record<number, ConflictDecision>>({});

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setActiveTab(defaultTab); }, [defaultTab]);

  const hasUnresolvedConflicts = conflicts.length > 0;
  const canApplyImport = useMemo(
    () => importRows.length > 0 && !saving && !hasUnresolvedConflicts,
    [hasUnresolvedConflicts, importRows.length, saving],
  );

  const applyImport = async (rows: EmployeeImportRow[], decisionMap: Record<number, ConflictDecision>) => {
    const merged = mergeEmployeeImportRows(employees, rows, (conflict) => decisionMap[conflict.row.rowNumber] ?? "overwrite");
    const message = t("employee.importExport.notice.importApplied", merged.summary);
    const ok = await replaceAll(merged.employees, message);
    if (!ok) return;
    setImportMessage(message);
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
      const initialDecisionMap = conflictResult.conflicts.reduce<Record<number, ConflictDecision>>(
        (acc, conflict) => ({ ...acc, [conflict.row.rowNumber]: "overwrite" }),
        {},
      );
      setDecisions(initialDecisionMap);
      setConflictDialogOpen(true);
    }
  };

  const handleTemplateDownload = () => {
    downloadBytes(createEmployeeTemplateWorkbook(), "employee-import-template.xlsx");
  };

  const handleEmployeeExport = () => {
    downloadBytes(buildEmployeeWorkbook(employees), "employee-list.xlsx");
  };

  const setAllConflictDecisions = (decision: ConflictDecision) => {
    setDecisions(conflicts.reduce<Record<number, ConflictDecision>>(
      (acc, conflict) => ({ ...acc, [conflict.row.rowNumber]: decision }),
      {},
    ));
  };

  return (
    <section className="grid gap-4">
      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <CardTitle>{t("employee.importExport.title")}</CardTitle>
          <CardDescription>{t("employee.importExport.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{errorMessage}</div>}
          {!errorMessage && noticeMessage && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{noticeMessage}</div>}
          {!errorMessage && importMessage && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{importMessage}</div>}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "import" | "export")}>
            <TabsList>
              <TabsTrigger value="import">{t("employee.importExport.tab.import")}</TabsTrigger>
              <TabsTrigger value="export">{t("employee.importExport.tab.export")}</TabsTrigger>
            </TabsList>
            <TabsContent value="import" className="space-y-4">
              <ImportPreview
                selectedFileName={selectedFileName}
                importRows={importRows}
                parseErrors={parseErrors}
                conflicts={conflicts}
                canApplyImport={canApplyImport}
                saving={saving}
                hasUnresolvedConflicts={hasUnresolvedConflicts}
                onTemplateDownload={handleTemplateDownload}
                onFileSelect={(file) => void handleImportFile(file)}
                onApplyImport={() => void applyImport(importRows, decisions)}
                onResolveConflicts={() => setConflictDialogOpen(true)}
              />
            </TabsContent>
            <TabsContent value="export" className="space-y-4">
              <ExportPanel employees={employees} loading={loading} saving={saving} onExport={handleEmployeeExport} />
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
            <Button variant="outline" onClick={() => setAllConflictDecisions("overwrite")}>
              {t("employee.importExport.conflict.allOverwrite")}
            </Button>
            <Button variant="outline" onClick={() => setAllConflictDecisions("skip")}>
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
                  <TableCell>{conflict.row.name} / {conflict.row.idCard || "-"}</TableCell>
                  <TableCell>{conflict.existing.name} / {conflict.existing.position}</TableCell>
                  <TableCell>
                    <Select
                      value={decisions[conflict.row.rowNumber] ?? "overwrite"}
                      onValueChange={(value) => setDecisions((prev) => ({ ...prev, [conflict.row.rowNumber]: value as ConflictDecision }))}
                    >
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
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
            <Button variant="outline" onClick={() => setConflictDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={() => void applyImport(importRows, decisions)} disabled={saving}>
              {saving ? t("common.saving") : t("employee.importExport.conflict.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
