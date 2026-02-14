import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEmployeeStore } from "@/stores/employee-store";
import type { Employee, EmployeeFormModel, EmployeeType } from "@/types/payroll";

interface InlineEditDraft {
  name: string;
  companyShort: string;
  position: string;
  baseSalary: number;
  subsidy: number;
  fundAmount: number;
}

function createEmptyForm(): EmployeeFormModel {
  return {
    name: "",
    idCard: "",
    companyShort: "",
    company: "",
    dept: "",
    position: "",
    type: "管理",
    baseSalary: 0,
    subsidy: 0,
    hasSocial: true,
    hasLocalPension: true,
    fundAmount: 0,
  };
}

function toFormModel(employee: Employee): EmployeeFormModel {
  return {
    id: employee.id,
    name: employee.name,
    idCard: employee.idCard,
    companyShort: employee.companyShort,
    company: employee.company,
    dept: employee.dept,
    position: employee.position,
    type: employee.type,
    baseSalary: employee.baseSalary,
    subsidy: employee.subsidy,
    hasSocial: employee.hasSocial,
    hasLocalPension: employee.hasLocalPension,
    fundAmount: employee.fundAmount,
  };
}

function formatAmount(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseNumber(value: string, fallback: number): number {
  if (value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

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

  const setAddField = <K extends keyof EmployeeFormModel>(key: K, value: EmployeeFormModel[K]) => {
    setAddForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resolveCompanyFullName = (companyShort: string, fallback = ""): string => {
    return companyMap.get(companyShort) ?? (fallback || companyShort);
  };

  const handleAddEmployee = async () => {
    const payload: EmployeeFormModel = {
      ...addForm,
      company: resolveCompanyFullName(addForm.companyShort, addForm.company),
    };

    const ok = await addEmployee(payload);
    if (!ok) {
      return;
    }

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
    if (editingId === null || !inlineDraft) {
      return;
    }

    const current = employees.find((employee) => employee.id === editingId);
    if (!current) {
      return;
    }

    const payload: EmployeeFormModel = {
      ...toFormModel(current),
      name: inlineDraft.name,
      companyShort: inlineDraft.companyShort,
      company: resolveCompanyFullName(inlineDraft.companyShort, current.company),
      position: inlineDraft.position,
      baseSalary: inlineDraft.baseSalary,
      subsidy: inlineDraft.subsidy,
      fundAmount: inlineDraft.fundAmount,
    };

    const ok = await updateEmployee(editingId, payload);
    if (!ok) {
      return;
    }

    setEditingId(null);
    setInlineDraft(null);
  };

  const handleDelete = async (employee: Employee) => {
    if (!window.confirm(t("employee.list.dialog.deleteConfirm", { name: employee.name }))) {
      return;
    }

    const ok = await removeEmployee(employee.id);
    if (!ok) {
      return;
    }

    if (expandedId === employee.id) {
      setExpandedId(null);
    }
    if (editingId === employee.id) {
      setEditingId(null);
      setInlineDraft(null);
    }
  };

  return (
    <section className="grid gap-4">
      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <CardTitle>{t("employee.list.title")}</CardTitle>
          <CardDescription>{t("employee.list.description")}</CardDescription>
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
              {employees.map((employee) => {
                const isEditing = editingId === employee.id && inlineDraft;

                return (
                  <TableRow
                    key={employee.id}
                    onClick={() => {
                      if (isEditing) {
                        return;
                      }
                      setExpandedId((prev) => (prev === employee.id ? null : employee.id));
                    }}
                  >
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={inlineDraft.name}
                          onChange={(event) =>
                            setInlineDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    name: event.target.value,
                                  }
                                : prev,
                            )
                          }
                          onClick={(event) => event.stopPropagation()}
                        />
                      ) : (
                        employee.name
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={inlineDraft.companyShort}
                          onValueChange={(value) =>
                            setInlineDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    companyShort: value,
                                  }
                                : prev,
                            )
                          }
                        >
                          <SelectTrigger className="w-full" onClick={(event) => event.stopPropagation()}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {companyOptions.map((company) => (
                              <SelectItem key={company.short} value={company.short}>
                                {company.short}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        employee.companyShort
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={inlineDraft.position}
                          onChange={(event) =>
                            setInlineDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    position: event.target.value,
                                  }
                                : prev,
                            )
                          }
                          onClick={(event) => event.stopPropagation()}
                        />
                      ) : (
                        employee.position
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={inlineDraft.baseSalary}
                          onChange={(event) =>
                            setInlineDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    baseSalary: parseNumber(event.target.value, prev.baseSalary),
                                  }
                                : prev,
                            )
                          }
                          onClick={(event) => event.stopPropagation()}
                        />
                      ) : (
                        formatAmount(employee.baseSalary)
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={inlineDraft.subsidy}
                          onChange={(event) =>
                            setInlineDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    subsidy: parseNumber(event.target.value, prev.subsidy),
                                  }
                                : prev,
                            )
                          }
                          onClick={(event) => event.stopPropagation()}
                        />
                      ) : (
                        formatAmount(employee.subsidy)
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={inlineDraft.fundAmount}
                          onChange={(event) =>
                            setInlineDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    fundAmount: parseNumber(event.target.value, prev.fundAmount),
                                  }
                                : prev,
                            )
                          }
                          onClick={(event) => event.stopPropagation()}
                        />
                      ) : (
                        formatAmount(employee.fundAmount)
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleSaveInlineEdit();
                              }}
                              disabled={saving}
                            >
                              {t("common.save")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(event) => {
                                event.stopPropagation();
                                setEditingId(null);
                                setInlineDraft(null);
                              }}
                              disabled={saving}
                            >
                              {t("common.cancel")}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleStartInlineEdit(employee);
                              }}
                            >
                              {t("common.edit")}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleDelete(employee);
                              }}
                            >
                              {t("common.delete")}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {t("employee.list.empty")}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {expandedEmployee ? (
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>{t("employee.list.detail.title")}</CardTitle>
            <CardDescription>{t("employee.list.detail.description")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <div>
              <Button variant="outline" size="sm" onClick={() => handleStartInlineEdit(expandedEmployee)}>
                {t("employee.list.detail.editAction")}
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
            <p>{t("employee.list.detail.name", { value: expandedEmployee.name })}</p>
            <p>{t("employee.list.detail.idCard", { value: expandedEmployee.idCard || "-" })}</p>
            <p>{t("employee.list.detail.company", { value: expandedEmployee.company })}</p>
            <p>{t("employee.list.detail.department", { value: expandedEmployee.dept || "-" })}</p>
            <p>{t("employee.list.detail.position", { value: expandedEmployee.position || "-" })}</p>
            <p>{t("employee.list.detail.type", { value: expandedEmployee.type })}</p>
            <p>{t("employee.list.detail.baseSalary", { value: formatAmount(expandedEmployee.baseSalary) })}</p>
            <p>{t("employee.list.detail.subsidy", { value: formatAmount(expandedEmployee.subsidy) })}</p>
            <p>{t("employee.list.detail.hasSocial", { value: expandedEmployee.hasSocial ? t("common.yes") : t("common.no") })}</p>
            <p>
              {t("employee.list.detail.hasLocalPension", {
                value: expandedEmployee.hasLocalPension ? t("common.yes") : t("common.no"),
              })}
            </p>
            <p>{t("employee.list.detail.fund", { value: formatAmount(expandedEmployee.fundAmount) })}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("employee.list.dialog.addTitle")}</DialogTitle>
            <DialogDescription>{t("employee.list.dialog.addDescription")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span>{t("employee.form.name")}</span>
              <Input value={addForm.name} onChange={(event) => setAddField("name", event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>{t("employee.form.idCard")}</span>
              <Input value={addForm.idCard} onChange={(event) => setAddField("idCard", event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>{t("employee.form.company")}</span>
              <Select
                value={addForm.companyShort}
                onValueChange={(value) => {
                  setAddForm((prev) => ({
                    ...prev,
                    companyShort: value,
                    company: resolveCompanyFullName(value, prev.company),
                  }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("employee.form.companyPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {companyOptions.map((company) => (
                    <SelectItem key={company.short} value={company.short}>
                      {company.short} - {company.full}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-1 text-sm">
              <span>{t("employee.form.department")}</span>
              <Input value={addForm.dept} onChange={(event) => setAddField("dept", event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>{t("employee.form.position")}</span>
              <Input value={addForm.position} onChange={(event) => setAddField("position", event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>{t("employee.form.type")}</span>
              <Select value={addForm.type} onValueChange={(value) => setAddField("type", value as EmployeeType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="管理">{t("employee.form.typeManagement")}</SelectItem>
                  <SelectItem value="销售">{t("employee.form.typeSales")}</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-1 text-sm">
              <span>{t("employee.form.baseSalary")}</span>
              <Input
                type="number"
                value={addForm.baseSalary}
                onChange={(event) => setAddField("baseSalary", parseNumber(event.target.value, addForm.baseSalary))}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>{t("employee.form.subsidy")}</span>
              <Input
                type="number"
                value={addForm.subsidy}
                onChange={(event) => setAddField("subsidy", parseNumber(event.target.value, addForm.subsidy))}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>{t("employee.form.fund")}</span>
              <Input
                type="number"
                value={addForm.fundAmount}
                onChange={(event) => setAddField("fundAmount", parseNumber(event.target.value, addForm.fundAmount))}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={addForm.hasSocial}
                onChange={(event) =>
                  setAddForm((prev) => ({
                    ...prev,
                    hasSocial: event.target.checked,
                    hasLocalPension: event.target.checked ? prev.hasLocalPension : false,
                  }))
                }
              />
              <span>{t("employee.form.hasSocial")}</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={addForm.hasLocalPension}
                disabled={!addForm.hasSocial}
                onChange={(event) => setAddField("hasLocalPension", event.target.checked)}
              />
              <span>{t("employee.form.hasLocalPension")}</span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={saving}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => void handleAddEmployee()} disabled={saving}>
              {saving ? t("common.saving") : t("common.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
