import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const overviewCards = [
  { key: "settings", route: "/settings/org" },
  { key: "employee", route: "/employee/list" },
  { key: "payroll", route: "/payroll/employee" },
  { key: "voucher", route: "/voucher" },
  { key: "data", route: "/data/backup" },
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
            <CardContent className="text-sm text-muted-foreground">{t("app.comingSoon")}</CardContent>
          </Card>
        </Link>
      ))}
    </section>
  );
}
