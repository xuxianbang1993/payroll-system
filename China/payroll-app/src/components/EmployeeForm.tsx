import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Company, EmployeeFormModel, EmployeeType } from "@/types/payroll";
import { parseNumber } from "@/utils/format";

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: EmployeeFormModel;
  onFieldChange: <K extends keyof EmployeeFormModel>(key: K, value: EmployeeFormModel[K]) => void;
  onFormChange: (formData: EmployeeFormModel) => void;
  onSubmit: () => void;
  companyOptions: Company[];
  resolveCompanyFullName: (companyShort: string, fallback?: string) => string;
  saving: boolean;
}

export function EmployeeForm({
  open,
  onOpenChange,
  formData,
  onFieldChange,
  onFormChange,
  onSubmit,
  companyOptions,
  resolveCompanyFullName,
  saving,
}: EmployeeFormProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("employee.list.dialog.addTitle")}</DialogTitle>
          <DialogDescription>{t("employee.list.dialog.addDescription")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span>{t("employee.form.name")}</span>
            <Input value={formData.name} onChange={(event) => onFieldChange("name", event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("employee.form.idCard")}</span>
            <Input value={formData.idCard} onChange={(event) => onFieldChange("idCard", event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("employee.form.company")}</span>
            <Select
              value={formData.companyShort}
              onValueChange={(value) => {
                onFormChange({
                  ...formData,
                  companyShort: value,
                  company: resolveCompanyFullName(value, formData.company),
                });
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
            <Input value={formData.dept} onChange={(event) => onFieldChange("dept", event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("employee.form.position")}</span>
            <Input value={formData.position} onChange={(event) => onFieldChange("position", event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("employee.form.type")}</span>
            <Select value={formData.type} onValueChange={(value) => onFieldChange("type", value as EmployeeType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="management">{t("employee.form.typeManagement")}</SelectItem>
                <SelectItem value="sales">{t("employee.form.typeSales")}</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("employee.form.baseSalary")}</span>
            <Input
              type="number"
              value={formData.baseSalary}
              onChange={(event) => onFieldChange("baseSalary", parseNumber(event.target.value, formData.baseSalary))}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("employee.form.subsidy")}</span>
            <Input
              type="number"
              value={formData.subsidy}
              onChange={(event) => onFieldChange("subsidy", parseNumber(event.target.value, formData.subsidy))}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t("employee.form.fund")}</span>
            <Input
              type="number"
              value={formData.fundAmount}
              onChange={(event) => onFieldChange("fundAmount", parseNumber(event.target.value, formData.fundAmount))}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.hasSocial}
              onChange={(event) =>
                onFormChange({
                  ...formData,
                  hasSocial: event.target.checked,
                  hasLocalPension: event.target.checked ? formData.hasLocalPension : false,
                })
              }
            />
            <span>{t("employee.form.hasSocial")}</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.hasLocalPension}
              disabled={!formData.hasSocial}
              onChange={(event) => onFieldChange("hasLocalPension", event.target.checked)}
            />
            <span>{t("employee.form.hasLocalPension")}</span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? t("common.saving") : t("common.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
