import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Company, Employee } from "@/types/payroll";
import type { InlineEditDraft } from "@/utils/employee-utils";
import { formatAmount, parseNumber } from "@/utils/format";

interface EmployeeInlineRowProps {
  employee: Employee;
  isEditing: boolean;
  inlineDraft: InlineEditDraft | null;
  onStartEdit: (employee: Employee) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDraftChange: (draft: InlineEditDraft) => void;
  onDelete: (employee: Employee) => void;
  onRowClick: () => void;
  companyOptions: Company[];
  saving: boolean;
}

export function EmployeeInlineRow({
  employee,
  isEditing,
  inlineDraft,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDraftChange,
  onDelete,
  onRowClick,
  companyOptions,
  saving,
}: EmployeeInlineRowProps) {
  const { t } = useTranslation();

  const updateDraft = <K extends keyof InlineEditDraft>(key: K, value: InlineEditDraft[K]) => {
    if (!inlineDraft) return;
    onDraftChange({ ...inlineDraft, [key]: value });
  };

  return (
    <TableRow onClick={() => !isEditing && onRowClick()}>
      <TableCell>
        {isEditing && inlineDraft ? (
          <Input
            value={inlineDraft.name}
            onChange={(e) => updateDraft("name", e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          employee.name
        )}
      </TableCell>
      <TableCell>
        {isEditing && inlineDraft ? (
          <Select value={inlineDraft.companyShort} onValueChange={(value) => updateDraft("companyShort", value)}>
            <SelectTrigger className="w-full" onClick={(e) => e.stopPropagation()}>
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
        {isEditing && inlineDraft ? (
          <Input
            value={inlineDraft.position}
            onChange={(e) => updateDraft("position", e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          employee.position
        )}
      </TableCell>
      <TableCell>
        {isEditing && inlineDraft ? (
          <Input
            type="number"
            value={inlineDraft.baseSalary}
            onChange={(e) => updateDraft("baseSalary", parseNumber(e.target.value, inlineDraft.baseSalary))}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          formatAmount(employee.baseSalary)
        )}
      </TableCell>
      <TableCell>
        {isEditing && inlineDraft ? (
          <Input
            type="number"
            value={inlineDraft.subsidy}
            onChange={(e) => updateDraft("subsidy", parseNumber(e.target.value, inlineDraft.subsidy))}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          formatAmount(employee.subsidy)
        )}
      </TableCell>
      <TableCell>
        {isEditing && inlineDraft ? (
          <Input
            type="number"
            value={inlineDraft.fundAmount}
            onChange={(e) => updateDraft("fundAmount", parseNumber(e.target.value, inlineDraft.fundAmount))}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          formatAmount(employee.fundAmount)
        )}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button size="sm" onClick={(e) => { e.stopPropagation(); onSaveEdit(); }} disabled={saving}>
                {t("common.save")}
              </Button>
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onCancelEdit(); }} disabled={saving}>
                {t("common.cancel")}
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onStartEdit(employee); }}>
                {t("common.edit")}
              </Button>
              <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); onDelete(employee); }}>
                {t("common.delete")}
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
