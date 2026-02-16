import type { Employee } from "@/types/payroll";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

interface ExportPanelProps {
  employees: Employee[];
  loading: boolean;
  saving: boolean;
  onExport: () => void;
}

export function ExportPanel({ employees, loading, saving, onExport }: ExportPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("employee.importExport.export.summary", { count: employees.length })}
      </p>
      <Button onClick={onExport} disabled={loading || saving}>
        {t("employee.importExport.action.exportEmployees")}
      </Button>
    </div>
  );
}
