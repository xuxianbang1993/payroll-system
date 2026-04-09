import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";

import { VoucherCard } from "@/components/VoucherCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aggregatePaySlips } from "@/services/aggregator";
import { generateVouchers } from "@/services/voucherGenerator";
import { useAppStore } from "@/stores/app-store";
import { usePayrollStore } from "@/stores/payroll-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { PaySlip } from "@/types/payroll";
import { formatAmount } from "@/utils/format";
import { resolveMessage } from "@/utils/i18n-utils";
import { voucherSetToCsv } from "@/utils/voucher-csv";

const ALL_COMPANIES_VALUE = "__all__";

export function VoucherPage() {
  const { t } = useTranslation();
  const selectedMonth = useAppStore((state) => state.selectedMonth);
  const slips = usePayrollStore((state) => state.slips);
  const loading = usePayrollStore((state) => state.loading);
  const errorMessage = usePayrollStore((state) => state.errorMessage);
  const noticeMessage = usePayrollStore((state) => state.noticeMessage);
  const loadForMonth = usePayrollStore((state) => state.loadForMonth);
  const clearMessages = usePayrollStore((state) => state.clearMessages);
  const companies = useSettingsStore((state) => state.settings.companies);
  const settingsLoading = useSettingsStore((state) => state.loading);
  const loadSettings = useSettingsStore((state) => state.load);

  const [filterCompany, setFilterCompany] = useState<string>(ALL_COMPANIES_VALUE);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    void loadForMonth(selectedMonth);
  }, [loadForMonth, selectedMonth]);

  useEffect(() => {
    return () => {
      clearMessages();
    };
  }, [clearMessages]);

  const slipArray = useMemo<PaySlip[]>(() => Object.values(slips), [slips]);
  const normalizedFilter = filterCompany === ALL_COMPANIES_VALUE ? undefined : filterCompany;

  const aggregate = useMemo(
    () => aggregatePaySlips(slipArray, normalizedFilter),
    [normalizedFilter, slipArray],
  );

  const voucherSet = useMemo(
    () => generateVouchers(aggregate, selectedMonth),
    [aggregate, selectedMonth],
  );

  const sortedCompanies = useMemo(
    () =>
      [...companies].sort((left, right) =>
        (left.full || left.short).localeCompare(right.full || right.short, "zh-Hans-CN"),
      ),
    [companies],
  );

  const resolvedNoticeMessage = useMemo(() => {
    if (!noticeMessage) {
      return "";
    }

    return resolveMessage(noticeMessage, t);
  }, [noticeMessage, t]);

  const resolvedErrorMessage = useMemo(() => {
    if (!errorMessage) {
      return "";
    }

    return resolveMessage(errorMessage, t);
  }, [errorMessage, t]);

  const handleExportCsv = () => {
    const csv = voucherSetToCsv(voucherSet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = `vouchers-${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <section className="grid gap-4">
      <Card className="border-border/80 bg-card/95">
        <CardHeader className="gap-4">
          <div>
            <CardTitle>{t("nav.page.voucherOverview")}</CardTitle>
            <CardDescription>{t("voucher.voucherCount", { count: voucherSet.vouchers.length })}</CardDescription>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("nav.page.company")}</span>
              <Select
                value={filterCompany}
                onValueChange={setFilterCompany}
                disabled={loading || settingsLoading}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder={t("voucher.filterAll")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_COMPANIES_VALUE}>{t("voucher.filterAll")}</SelectItem>
                  {sortedCompanies.map((company) => (
                    <SelectItem key={company.short} value={company.short}>
                      {company.full || company.short}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                disabled={loading || voucherSet.vouchers.length === 0}
              >
                <Download />
                {t("voucher.exportCsv")}
              </Button>
            </div>

            <Badge variant="outline">{selectedMonth}</Badge>
          </div>
        </CardHeader>
      </Card>

      {resolvedErrorMessage ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {resolvedErrorMessage}
        </div>
      ) : null}

      {!resolvedErrorMessage && resolvedNoticeMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {resolvedNoticeMessage}
        </div>
      ) : null}

      <Card className="border-border/80 bg-card/95">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>{t("voucher.balanceCheck")}</CardTitle>
            <CardDescription>{t("voucher.salaryPayable")}</CardDescription>
          </div>
          <Badge variant={voucherSet.balanceCheck.balanced ? "default" : "destructive"}>
            {voucherSet.balanceCheck.balanced
              ? t("voucher.balanced")
              : `${t("voucher.unbalanced")} ${formatAmount(Math.abs(voucherSet.balanceCheck.balance))}`}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[var(--radius-sm)] border border-border/70 bg-muted/30 p-4">
            <div className="text-sm text-muted-foreground">{t("voucher.creditTotal")}</div>
            <div className="mt-2 font-mono text-2xl font-semibold">
              {formatAmount(voucherSet.balanceCheck.credit)}
            </div>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-border/70 bg-muted/30 p-4">
            <div className="text-sm text-muted-foreground">{t("voucher.debitTotal")}</div>
            <div className="mt-2 font-mono text-2xl font-semibold">
              {formatAmount(voucherSet.balanceCheck.debit)}
            </div>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-border/70 bg-muted/30 p-4">
            <div className="text-sm text-muted-foreground">{t("voucher.balance")}</div>
            <div className="mt-2 font-mono text-2xl font-semibold">
              {formatAmount(voucherSet.balanceCheck.balance)}
            </div>
          </div>
        </CardContent>
      </Card>

      {slipArray.length === 0 && !loading ? (
        <Card className="border-border/80 bg-card/95">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("voucher.noData")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {voucherSet.vouchers.map((voucher) => (
            <VoucherCard key={voucher.id} voucher={voucher} />
          ))}
        </div>
      )}
    </section>
  );
}
