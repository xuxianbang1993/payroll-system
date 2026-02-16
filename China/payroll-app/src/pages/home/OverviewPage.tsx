import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/stores/app-store";

const kpiItems = [
  { key: "people", labelKey: "overview.kpi.people", valueKey: "overview.kpi.peopleValue", subKey: "overview.kpi.peopleSub" },
  { key: "pay", labelKey: "overview.kpi.pay", valueKey: "overview.kpi.payValue", subKey: "overview.kpi.paySub" },
  { key: "done", labelKey: "overview.kpi.done", valueKey: "overview.kpi.doneValue", subKey: "overview.kpi.doneSub" },
  { key: "warn", labelKey: "overview.kpi.warn", valueKey: "overview.kpi.warnValue", subKey: "overview.kpi.warnSub" },
] as const;

const overviewCards = [
  {
    key: "settings",
    route: "/settings/org",
    statusKey: "overview.status.ready",
    icon: "⚙️",
    items: [
      { titleKey: "nav.page.org", path: "/settings/org" },
      { titleKey: "nav.page.social", path: "/settings/social" },
      { titleKey: "nav.page.company", path: "/settings/company" },
    ],
  },
  {
    key: "employee",
    route: "/employee/list",
    statusKey: "overview.status.ready",
    icon: "👥",
    items: [
      { titleKey: "nav.page.employeeList", path: "/employee/list" },
      { titleKey: "nav.page.employeeImport", path: "/employee/import" },
      { titleKey: "nav.page.employeeExport", path: "/employee/export" },
    ],
  },
  {
    key: "payroll",
    route: "/payroll/employee",
    statusKey: "overview.status.pending",
    icon: "💰",
    items: [
      { titleKey: "nav.page.payrollByEmp", path: "/payroll/employee" },
      { titleKey: "nav.page.payrollDetail", path: "/payroll/detail" },
    ],
  },
  {
    key: "voucher",
    route: "/voucher",
    statusKey: "overview.status.pending",
    icon: "📋",
    items: [{ titleKey: "nav.page.voucherOverview", path: "/voucher" }],
  },
  {
    key: "data",
    route: "/data/backup",
    statusKey: "overview.status.ready",
    icon: "🔧",
    items: [
      { titleKey: "nav.page.backup", path: "/data/backup" },
      { titleKey: "nav.page.storage", path: "/data/storage" },
    ],
  },
] as const;

export function OverviewPage() {
  const { t } = useTranslation();
  const selectedMonth = useAppStore((state) => state.selectedMonth);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{t("app.overview")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">
            <span aria-hidden="true">📅</span>
            {t("app.month")}
            <span className="mono-num text-foreground">{selectedMonth}</span>
          </span>
          <span className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">
            5 / 5
          </span>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {kpiItems.map((item) => (
          <Card key={item.key} className="border-border/80 bg-card/95 py-3">
            <CardContent className="grid gap-1.5 px-4">
              <p className="text-xs font-semibold text-muted-foreground">{t(item.labelKey)}</p>
              <p className="mono-num text-[30px] leading-none text-foreground">{t(item.valueKey)}</p>
              <p className="text-xs text-muted-foreground">{t(item.subKey)}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {overviewCards.map((card) => {
          const firstItem = card.items[0];
          const isPending = card.statusKey === "overview.status.pending";
          return (
            <Card key={card.key} className="h-full min-h-[292px] border-border/80 bg-card/95 py-4">
              <CardHeader className="gap-3 px-4 pb-0 sm:px-5">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-[22px] font-semibold leading-none tracking-tight">
                    <span aria-hidden="true">{card.icon}</span>
                    <span>{t(`nav.category.${card.key}`)}</span>
                  </CardTitle>
                  <Badge variant={isPending ? "pending" : "ready"}>{isPending ? "pending" : "ready"}</Badge>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-3 px-4 pt-2 sm:px-5">
                <div className="grid gap-1.5">
                  {card.items.map((item) => (
                    <Button
                      key={item.path}
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 justify-between rounded-md px-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <Link to={item.path}>
                        <span>{t(item.titleKey)}</span>
                        <span className="text-xs text-muted-foreground">→</span>
                      </Link>
                    </Button>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground">{t(card.statusKey)}</p>

                <div className="mt-auto pt-1">
                  <Button asChild variant="outline" size="sm" className="h-9">
                    <Link to={card.route}>{t("overview.enterAction", { page: t(firstItem.titleKey) })}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </section>
  );
}
