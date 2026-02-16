import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Employee, EmployeeType } from "@/types/payroll";
import { formatAmount } from "@/utils/format";

interface EmployeeDetailProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
}

export function EmployeeDetail({ employee, onEdit }: EmployeeDetailProps) {
  const { t } = useTranslation();

  const translateEmployeeType = (type: EmployeeType): string => {
    return type === "sales" ? t("employee.form.typeSales") : t("employee.form.typeManagement");
  };

  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader>
        <CardTitle>{t("employee.list.detail.title")}</CardTitle>
        <CardDescription>{t("employee.list.detail.description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-muted-foreground">
        <div>
          <Button variant="outline" size="sm" onClick={() => onEdit(employee)}>
            {t("employee.list.detail.editAction")}
          </Button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <p>{t("employee.list.detail.name", { value: employee.name })}</p>
          <p>{t("employee.list.detail.idCard", { value: employee.idCard || "-" })}</p>
          <p>{t("employee.list.detail.company", { value: employee.company })}</p>
          <p>{t("employee.list.detail.department", { value: employee.dept || "-" })}</p>
          <p>{t("employee.list.detail.position", { value: employee.position || "-" })}</p>
          <p>{t("employee.list.detail.type", { value: translateEmployeeType(employee.type) })}</p>
          <p>{t("employee.list.detail.baseSalary", { value: formatAmount(employee.baseSalary) })}</p>
          <p>{t("employee.list.detail.subsidy", { value: formatAmount(employee.subsidy) })}</p>
          <p>
            {t("employee.list.detail.hasSocial", { value: employee.hasSocial ? t("common.yes") : t("common.no") })}
          </p>
          <p>
            {t("employee.list.detail.hasLocalPension", {
              value: employee.hasLocalPension ? t("common.yes") : t("common.no"),
            })}
          </p>
          <p>{t("employee.list.detail.fund", { value: formatAmount(employee.fundAmount) })}</p>
        </div>
      </CardContent>
    </Card>
  );
}
