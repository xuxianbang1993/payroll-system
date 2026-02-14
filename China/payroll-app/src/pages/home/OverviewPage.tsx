import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const overviewCards = [
  { key: "settings", route: "/settings/org", statusKey: "overview.status.ready" },
  { key: "employee", route: "/employee/list", statusKey: "overview.status.ready" },
  { key: "payroll", route: "/payroll/employee", statusKey: "overview.status.pending" },
  { key: "voucher", route: "/voucher", statusKey: "overview.status.pending" },
  { key: "data", route: "/data/backup", statusKey: "overview.status.ready" },
] as const;

export function OverviewPage() {
  const { t } = useTranslation();

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {overviewCards.map((card) => (
        <Link key={card.key} to={card.route} className="block transition-transform duration-150 hover:-translate-y-0.5">
          <Card className="h-full border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle>{t(`nav.category.${card.key}`)}</CardTitle>
              <CardDescription>{t(`overview.${card.key}`)}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{t(card.statusKey)}</CardContent>
          </Card>
        </Link>
      ))}
    </section>
  );
}
