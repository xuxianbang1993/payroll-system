import { useEffect, useMemo, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MonthPicker } from "@/components/MonthPicker";
import { PayCard } from "@/components/PayCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePayrollStore } from "@/stores/payroll-store";
import type { AggregateResult, Employee, PayrollInput } from "@/types/payroll";
import { formatAmount } from "@/utils/format";
import { resolveMessage } from "@/utils/i18n-utils";

const EMPTY_TOTALS: AggregateResult["total"] = {
  fullGrossPay: 0,
  cSocial: 0,
  cFund: 0,
  wSocial: 0,
  wFund: 0,
  tax: 0,
  netPay: 0,
  absentDeduct: 0,
};

interface StatItem {
  labelKey: string;
  value: string;
}

export function PayrollByEmpPage() {
  const { t } = useTranslation();
  const selectedMonth = usePayrollStore((state) => state.selectedMonth);
  const employees = usePayrollStore((state) => state.employees);
  const inputs = usePayrollStore((state) => state.inputs);
  const slips = usePayrollStore((state) => state.slips);
  const aggregate = usePayrollStore((state) => state.aggregate);
  const loading = usePayrollStore((state) => state.loading);
  const generating = usePayrollStore((state) => state.generating);
  const errorMessage = usePayrollStore((state) => state.errorMessage);
  const noticeMessage = usePayrollStore((state) => state.noticeMessage);
  const loadForMonth = usePayrollStore((state) => state.loadForMonth);
  const setMonth = usePayrollStore((state) => state.setMonth);
  const updateInput = usePayrollStore((state) => state.updateInput);
  const generateSlip = usePayrollStore((state) => state.generateSlip);
  const generateAll = usePayrollStore((state) => state.generateAll);
  const clearMessages = usePayrollStore((state) => state.clearMessages);

  const didInitialLoad = useRef(false);

  useEffect(() => {
    if (didInitialLoad.current) {
      return;
    }

    didInitialLoad.current = true;
    void loadForMonth(selectedMonth);
  }, [loadForMonth, selectedMonth]);

  useEffect(() => {
    return () => {
      clearMessages();
    };
  }, [clearMessages]);

  const totals = aggregate?.total ?? EMPTY_TOTALS;

  const statItems = useMemo<StatItem[]>(
    () => [
      {
        labelKey: "payroll.page.stats.employeeCount",
        value: employees.length.toString(),
      },
      {
        labelKey: "payroll.page.stats.grossPayTotal",
        value: formatAmount(totals.fullGrossPay),
      },
      {
        labelKey: "payroll.page.stats.netPayTotal",
        value: formatAmount(totals.netPay),
      },
      {
        labelKey: "payroll.page.stats.cSocialTotal",
        value: formatAmount(totals.cSocial),
      },
    ],
    [employees.length, totals.cSocial, totals.fullGrossPay, totals.netPay],
  );

  const resolvedNoticeMessage = useMemo(() => {
    if (!noticeMessage) {
      return "";
    }
    if (noticeMessage === "success.payrollAllGenerated") {
      return t("payroll.page.notice.allGenerated");
    }

    return resolveMessage(noticeMessage, t);
  }, [noticeMessage, t]);

  const resolvedErrorMessage = useMemo(() => {
    if (!errorMessage) {
      return "";
    }
    if (errorMessage.startsWith("error.payrollGenerateAllFailed")) {
      return t("payroll.page.notice.generateFailed");
    }

    return resolveMessage(errorMessage, t);
  }, [errorMessage, t]);

  const handleMonthChange = async (month: string) => {
    if (month === selectedMonth || loading || generating) {
      return;
    }

    clearMessages();
    await setMonth(month);
  };

  const handleUpdateInput = async (employeeId: number, input: PayrollInput) => {
    clearMessages();
    return updateInput(employeeId, input);
  };

  const handleGenerateSlip = async (employeeId: number) => {
    clearMessages();
    return generateSlip(employeeId);
  };

  const handleGenerateAll = async () => {
    clearMessages();
    await generateAll();
  };

  const generatedCount = Object.keys(slips).length;

  return (
    <section className="grid gap-4">
      <Card className="border-border/80 bg-card/95">
        <CardHeader className="gap-4">
          <div>
            <CardTitle>{t("payroll.page.title")}</CardTitle>
            <CardDescription>{t("payroll.page.description")}</CardDescription>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <MonthPicker
              value={selectedMonth}
              onChange={(month) => void handleMonthChange(month)}
              disabled={loading || generating}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {t("payroll.card.statusGenerated")}: {generatedCount}/{employees.length}
              </Badge>
              <Button
                type="button"
                onClick={() => void handleGenerateAll()}
                disabled={loading || generating || employees.length === 0}
                aria-busy={generating}
              >
                {generating ? <Loader2 className="size-4 animate-spin" /> : null}
                {generating ? t("payroll.page.action.generating") : t("payroll.page.action.generateAll")}
              </Button>
              <Button type="button" variant="outline" disabled>
                {t("payroll.page.action.export")}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statItems.map((item) => (
          <Card key={item.labelKey} className="border-border/80">
            <CardContent className="space-y-2 p-4">
              <Badge variant="secondary">{t(item.labelKey)}</Badge>
              <p className="text-2xl font-semibold text-foreground">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {resolvedErrorMessage && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {resolvedErrorMessage}
        </div>
      )}
      {!resolvedErrorMessage && resolvedNoticeMessage && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {resolvedNoticeMessage}
        </div>
      )}

      <div className="grid gap-3">
        {employees.map((employee: Employee) => (
          <PayCard
            key={employee.id}
            employee={employee}
            input={inputs[employee.id]}
            slip={slips[employee.id]}
            onUpdateInput={handleUpdateInput}
            onGenerateSlip={handleGenerateSlip}
            generating={generating}
          />
        ))}

        {!loading && employees.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {t("payroll.page.empty.noEmployees")}
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
