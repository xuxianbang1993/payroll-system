import { Fragment, useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getGroupedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useTranslation } from "react-i18next";

import { MonthPicker } from "@/components/MonthPicker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { D } from "@/lib/decimal";
import { cn } from "@/lib/utils";
import { usePayrollStore } from "@/stores/payroll-store";
import type { AggregateResult } from "@/types/payroll";
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

interface PayrollDetailRow {
  employeeId: number;
  companyShort: string;
  name: string;
  position: string;
  base: number;
  subsidy: number;
  perfSalary: number;
  commission: number;
  bonus: number;
  absentDeduct: number;
  otherAdj: number;
  fullGrossPay: number;
  grossPay: number;
  cPension: number;
  cLocalPension: number;
  cUnemploy: number;
  cMedical: number;
  cInjury: number;
  cMaternity: number;
  cSocial: number;
  cFund: number;
  cTotal: number;
  wPension: number;
  wUnemploy: number;
  wMedical: number;
  wSocial: number;
  wFund: number;
  tax: number;
  totalDeduct: number;
  netPay: number;
}

const AMOUNT_FIELDS = [
  "base",
  "subsidy",
  "perfSalary",
  "commission",
  "bonus",
  "absentDeduct",
  "otherAdj",
  "fullGrossPay",
  "grossPay",
  "cPension",
  "cLocalPension",
  "cUnemploy",
  "cMedical",
  "cInjury",
  "cMaternity",
  "cSocial",
  "cFund",
  "cTotal",
  "wPension",
  "wUnemploy",
  "wMedical",
  "wSocial",
  "wFund",
  "tax",
  "totalDeduct",
  "netPay",
] as const;

type AmountField = (typeof AMOUNT_FIELDS)[number];

const AMOUNT_FIELD_SET = new Set<AmountField>(AMOUNT_FIELDS);

function toAmount(value?: number): number {
  const parsed = value ?? 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateTotals(rows: PayrollDetailRow[]): Record<AmountField, number> {
  const decimalTotals = {} as Record<AmountField, ReturnType<typeof D>>;

  for (const field of AMOUNT_FIELDS) {
    decimalTotals[field] = D(0);
  }

  for (const row of rows) {
    for (const field of AMOUNT_FIELDS) {
      decimalTotals[field] = decimalTotals[field].plus(row[field]);
    }
  }

  const totals = {} as Record<AmountField, number>;
  for (const field of AMOUNT_FIELDS) {
    totals[field] = decimalTotals[field].toDP(2).toNumber();
  }

  return totals;
}

export function PayrollDetailPage() {
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
  const generatedCount = Object.keys(slips).length;

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

  const detailRows = useMemo<PayrollDetailRow[]>(() => {
    const rows = employees.map((employee) => {
      const slip = slips[employee.id];
      const input = inputs[employee.id];
      const hasSlip = Boolean(slip);

      return {
        employeeId: employee.id,
        companyShort: employee.companyShort,
        name: employee.name,
        position: employee.position,
        base: toAmount(employee.baseSalary),
        subsidy: toAmount(employee.subsidy),
        perfSalary: hasSlip ? toAmount(slip.perfSalary) : toAmount(input?.perfSalary),
        commission: hasSlip ? toAmount(slip.commission) : toAmount(input?.commission),
        bonus: hasSlip ? toAmount(slip.bonus) : toAmount(input?.bonus),
        absentDeduct: hasSlip ? toAmount(slip.absentDeduct) : 0,
        otherAdj: hasSlip ? toAmount(slip.otherAdj) : toAmount(input?.otherAdj),
        fullGrossPay: hasSlip ? toAmount(slip.fullGrossPay) : 0,
        grossPay: hasSlip ? toAmount(slip.grossPay) : 0,
        cPension: hasSlip ? toAmount(slip.cPension) : 0,
        cLocalPension: hasSlip ? toAmount(slip.cLocalPension) : 0,
        cUnemploy: hasSlip ? toAmount(slip.cUnemploy) : 0,
        cMedical: hasSlip ? toAmount(slip.cMedical) : 0,
        cInjury: hasSlip ? toAmount(slip.cInjury) : 0,
        cMaternity: hasSlip ? toAmount(slip.cMaternity) : 0,
        cSocial: hasSlip ? toAmount(slip.cSocial) : 0,
        cFund: hasSlip ? toAmount(slip.cFund) : 0,
        cTotal: hasSlip ? toAmount(slip.cTotal) : 0,
        wPension: hasSlip ? toAmount(slip.wPension) : 0,
        wUnemploy: hasSlip ? toAmount(slip.wUnemploy) : 0,
        wMedical: hasSlip ? toAmount(slip.wMedical) : 0,
        wSocial: hasSlip ? toAmount(slip.wSocial) : 0,
        wFund: hasSlip ? toAmount(slip.wFund) : 0,
        tax: hasSlip ? toAmount(slip.tax) : toAmount(input?.tax),
        totalDeduct: hasSlip ? toAmount(slip.totalDeduct) : 0,
        netPay: hasSlip ? toAmount(slip.netPay) : 0,
      };
    });

    return rows.sort(
      (a, b) =>
        a.companyShort.localeCompare(b.companyShort) ||
        a.name.localeCompare(b.name) ||
        a.employeeId - b.employeeId,
    );
  }, [employees, inputs, slips]);

  const columns = useMemo<ColumnDef<PayrollDetailRow>[]>(
    () => {
      const amountColumn = (field: AmountField): ColumnDef<PayrollDetailRow> => ({
        accessorKey: field,
        header: () => t(`payroll.detail.col.${field}`),
        cell: (info) => formatAmount(info.getValue<number>()),
      });

      return [
        {
          accessorKey: "companyShort",
          header: "companyShort",
          enableGrouping: true,
        },
        {
          id: "basicInfo",
          header: () => t("payroll.detail.group.basicInfo"),
          columns: [
            {
              accessorKey: "name",
              header: () => t("payroll.detail.col.name"),
              cell: (info) => info.getValue<string>(),
            },
            {
              accessorKey: "position",
              header: () => t("payroll.detail.col.position"),
              cell: (info) => info.getValue<string>(),
            },
          ],
        },
        {
          id: "income",
          header: () => t("payroll.detail.group.income"),
          columns: [
            amountColumn("base"),
            amountColumn("subsidy"),
            amountColumn("perfSalary"),
            amountColumn("commission"),
            amountColumn("bonus"),
            amountColumn("absentDeduct"),
            amountColumn("otherAdj"),
          ],
        },
        {
          id: "paySummary",
          header: () => t("payroll.detail.group.paySummary"),
          columns: [amountColumn("fullGrossPay"), amountColumn("grossPay")],
        },
        {
          id: "employerBurden",
          header: () => t("payroll.detail.group.employerBurden"),
          columns: [
            amountColumn("cPension"),
            amountColumn("cLocalPension"),
            amountColumn("cUnemploy"),
            amountColumn("cMedical"),
            amountColumn("cInjury"),
            amountColumn("cMaternity"),
            amountColumn("cSocial"),
            amountColumn("cFund"),
            amountColumn("cTotal"),
          ],
        },
        {
          id: "personalDeduction",
          header: () => t("payroll.detail.group.personalDeduction"),
          columns: [
            amountColumn("wPension"),
            amountColumn("wUnemploy"),
            amountColumn("wMedical"),
            amountColumn("wSocial"),
            amountColumn("wFund"),
            amountColumn("tax"),
            amountColumn("totalDeduct"),
          ],
        },
        {
          id: "final",
          header: () => t("payroll.detail.group.final"),
          columns: [amountColumn("netPay")],
        },
      ];
    },
    [t],
  );

  const table = useReactTable({
    data: detailRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    initialState: {
      grouping: ["companyShort"],
      columnVisibility: {
        companyShort: false,
      },
    },
  });

  const visibleLeafColumns = table.getVisibleLeafColumns();
  const groupedRows = table.getRowModel().rows;
  const grandTotal = useMemo(() => calculateTotals(detailRows), [detailRows]);

  const renderSummaryCell = (
    columnId: string,
    label: string,
    summary: Record<AmountField, number>,
  ): ReactNode => {
    if (columnId === "name") {
      return label;
    }

    if (AMOUNT_FIELD_SET.has(columnId as AmountField)) {
      return formatAmount(summary[columnId as AmountField]);
    }

    return "";
  };

  return (
    <section className="grid gap-4">
      <Card className="border-border/80 bg-card/95">
        <CardHeader className="gap-4">
          <div>
            <CardTitle>{t("payroll.detail.title")}</CardTitle>
            <CardDescription>{t("payroll.detail.description")}</CardDescription>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <MonthPicker
              value={selectedMonth}
              onChange={(month) => void handleMonthChange(month)}
              disabled={loading || generating}
            />

            <Badge variant="outline">
              {t("payroll.card.statusGenerated")}: {generatedCount}/{employees.length}
            </Badge>
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

      {!loading && employees.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {t("payroll.page.empty.noEmployees")}
          </CardContent>
        </Card>
      )}

      {!loading && employees.length > 0 && generatedCount === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {t("payroll.detail.empty")}
          </CardContent>
        </Card>
      )}

      {!loading && employees.length > 0 && (
        <Card className="border-border/80">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[3000px]">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent">
                      {headerGroup.headers.map((header) => {
                        const isLeaf = header.subHeaders.length === 0;
                        const isNameColumn = header.column.id === "name";
                        const isAmountColumn = AMOUNT_FIELD_SET.has(header.column.id as AmountField);

                        return (
                          <TableHead
                            key={header.id}
                            colSpan={header.colSpan}
                            className={cn(
                              "border-b border-border bg-muted/40 text-xs font-semibold text-foreground",
                              header.depth === 0 ? "h-11 text-center" : "h-10",
                              isLeaf ? "text-left" : "text-center",
                              isAmountColumn && isLeaf && "text-right",
                              isNameColumn && "sticky left-0 z-30 bg-muted/60",
                            )}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>

                <TableBody>
                  {groupedRows.map((groupRow) => {
                    const companyShort = String(groupRow.groupingValue ?? "-");
                    const employeeRows = groupRow.subRows;
                    const subtotal = calculateTotals(employeeRows.map((row) => row.original));

                    return (
                      <Fragment key={groupRow.id}>
                        {employeeRows.map((row) => (
                          <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => {
                              const columnId = cell.column.id;
                              const isAmountColumn = AMOUNT_FIELD_SET.has(columnId as AmountField);
                              const isNameColumn = columnId === "name";

                              return (
                                <TableCell
                                  key={cell.id}
                                  className={cn(
                                    "min-w-[120px]",
                                    isAmountColumn && "text-right tabular-nums",
                                    isNameColumn && "sticky left-0 z-20 bg-card font-medium",
                                  )}
                                >
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}

                        <TableRow className="bg-muted/30 font-semibold hover:bg-muted/40">
                          {visibleLeafColumns.map((column) => {
                            const isAmountColumn = AMOUNT_FIELD_SET.has(column.id as AmountField);
                            const isNameColumn = column.id === "name";

                            return (
                              <TableCell
                                key={`${groupRow.id}-${column.id}-subtotal`}
                                className={cn(
                                  "min-w-[120px]",
                                  isAmountColumn && "text-right tabular-nums",
                                  isNameColumn && "sticky left-0 z-20 bg-muted/30",
                                )}
                              >
                                {renderSummaryCell(
                                  column.id,
                                  `${companyShort} ${t("payroll.detail.subtotal")}`,
                                  subtotal,
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      </Fragment>
                    );
                  })}

                  <TableRow className="bg-primary/10 font-semibold hover:bg-primary/10">
                    {visibleLeafColumns.map((column) => {
                      const isAmountColumn = AMOUNT_FIELD_SET.has(column.id as AmountField);
                      const isNameColumn = column.id === "name";

                      return (
                        <TableCell
                          key={`grand-total-${column.id}`}
                          className={cn(
                            "min-w-[120px]",
                            isAmountColumn && "text-right tabular-nums",
                            isNameColumn && "sticky left-0 z-20 bg-primary/10",
                          )}
                        >
                          {renderSummaryCell(column.id, t("payroll.detail.grandTotal"), grandTotal)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
