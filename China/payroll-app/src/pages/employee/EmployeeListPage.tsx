import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmployeeDetail } from "@/components/EmployeeDetail";
import { EmployeeForm } from "@/components/EmployeeForm";
import { EmployeeInlineRow } from "@/components/EmployeeInlineRow";
import { useEmployeeStore } from "@/stores/employee-store";
import type { Employee, EmployeeFormModel } from "@/types/payroll";
import { createEmptyForm, toFormModel, type InlineEditDraft } from "@/utils/employee-utils";
import { resolveMessage } from "@/utils/i18n-utils";

export function EmployeeListPage() {
  const { t } = useTranslation();
  const {
    employees,
    companyOptions,
    load,
    addEmployee,
    updateEmployee,
    removeEmployee,
    loading,
    saving,
    errorMessage,
    noticeMessage,
  } = useEmployeeStore();

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [inlineDraft, setInlineDraft] = useState<InlineEditDraft | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState<EmployeeFormModel>(createEmptyForm());

  useEffect(() => {
    void load();
  }, [load]);

  const companyMap = useMemo(() => {
    return new Map(companyOptions.map((company) => [company.short, company.full]));
  }, [companyOptions]);

  const expandedEmployee = useMemo(
    () => employees.find((employee) => employee.id === expandedId) ?? null,
    [employees, expandedId],
  );

  const resolveCompanyFullName = (companyShort: string, fallback = ""): string => {
    return companyMap.get(companyShort) ?? (fallback || companyShort);
  };

  const setAddField = <K extends keyof EmployeeFormModel>(key: K, value: EmployeeFormModel[K]) => {
    setAddForm((prev) => ({ ...prev, [key]: value }));
  };

  const cancelInlineEdit = () => {
    setEditingId(null);
    setInlineDraft(null);
  };

  const handleAddEmployee = async () => {
    const payload: EmployeeFormModel = { ...addForm, company: resolveCompanyFullName(addForm.companyShort, addForm.company) };
    const ok = await addEmployee(payload);
    if (!ok) return;
    setAddDialogOpen(false);
    setAddForm(createEmptyForm());
  };

  const handleStartInlineEdit = (employee: Employee) => {
    setEditingId(employee.id);
    setInlineDraft({
      name: employee.name,
      companyShort: employee.companyShort,
      position: employee.position,
      baseSalary: employee.baseSalary,
      subsidy: employee.subsidy,
      fundAmount: employee.fundAmount,
    });
  };

  const handleSaveInlineEdit = async () => {
    if (editingId === null || !inlineDraft) return;
    const current = employees.find((employee) => employee.id === editingId);
    if (!current) return;

    const payload: EmployeeFormModel = {
      ...toFormModel(current),
      ...inlineDraft,
      company: resolveCompanyFullName(inlineDraft.companyShort, current.company),
    };

    const ok = await updateEmployee(editingId, payload);
    if (!ok) return;
    cancelInlineEdit();
  };

  const handleDelete = async (employee: Employee) => {
    if (!window.confirm(t("employee.list.dialog.deleteConfirm", { name: employee.name }))) return;
    const ok = await removeEmployee(employee.id);
    if (!ok) return;
    if (expandedId === employee.id) setExpandedId(null);
    if (editingId === employee.id) cancelInlineEdit();
  };

  return (
    <section className="grid gap-4">
      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <CardTitle>{t("employee.list.title")}</CardTitle>
          <CardDescription>{t("employee.list.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {resolveMessage(errorMessage, t)}
            </div>
          )}
          {!errorMessage && noticeMessage && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {resolveMessage(noticeMessage, t)}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setAddDialogOpen(true)} disabled={loading || saving}>
              {t("employee.list.action.add")}
            </Button>
            <Button variant="outline" onClick={() => void load()} disabled={loading || saving}>
              {t("common.refresh")}
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("employee.list.table.name")}</TableHead>
                <TableHead>{t("employee.list.table.company")}</TableHead>
                <TableHead>{t("employee.list.table.position")}</TableHead>
                <TableHead>{t("employee.list.table.baseSalary")}</TableHead>
                <TableHead>{t("employee.list.table.subsidy")}</TableHead>
                <TableHead>{t("employee.list.table.fund")}</TableHead>
                <TableHead className="text-right">{t("employee.list.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <EmployeeInlineRow
                  key={employee.id}
                  employee={employee}
                  isEditing={editingId === employee.id && !!inlineDraft}
                  inlineDraft={inlineDraft}
                  onStartEdit={handleStartInlineEdit}
                  onSaveEdit={() => void handleSaveInlineEdit()}
                  onCancelEdit={cancelInlineEdit}
                  onDraftChange={setInlineDraft}
                  onDelete={(emp) => void handleDelete(emp)}
                  onRowClick={() => setExpandedId((prev) => (prev === employee.id ? null : employee.id))}
                  companyOptions={companyOptions}
                  saving={saving}
                />
              ))}
              {employees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {t("employee.list.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {expandedEmployee && <EmployeeDetail employee={expandedEmployee} onEdit={handleStartInlineEdit} />}

      <EmployeeForm
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        formData={addForm}
        onFieldChange={setAddField}
        onFormChange={setAddForm}
        onSubmit={() => void handleAddEmployee()}
        companyOptions={companyOptions}
        resolveCompanyFullName={resolveCompanyFullName}
        saving={saving}
      />
    </section>
  );
}
