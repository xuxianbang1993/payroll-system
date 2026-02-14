import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSettingsStore } from "@/stores/settings-store";

function formatCurrency(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function OrgSettingsPage() {
  const { t } = useTranslation();
  const {
    settings,
    orgStats,
    loading,
    saving,
    errorMessage,
    noticeMessage,
    load,
    saveOrgName,
  } = useSettingsStore();

  const [editing, setEditing] = useState(false);
  const [orgNameDraft, setOrgNameDraft] = useState(settings.orgName);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setOrgNameDraft(settings.orgName);
  }, [settings.orgName]);

  const metrics = useMemo(
    () => [
      {
        key: "employeeCount",
        title: t("settings.org.metrics.employeeCount"),
        value: String(orgStats.employeeCount),
      },
      {
        key: "companyCount",
        title: t("settings.org.metrics.companyCount"),
        value: String(orgStats.companyCount),
      },
      {
        key: "monthlyBaseTotal",
        title: t("settings.org.metrics.monthlyBaseTotal"),
        value: formatCurrency(orgStats.monthlyBaseTotal),
      },
    ],
    [orgStats, t],
  );

  const handleSave = async () => {
    const ok = await saveOrgName(orgNameDraft);
    if (!ok) {
      return;
    }

    setEditing(false);
  };

  return (
    <section className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.key} className="border-border/80 bg-card/95">
            <CardHeader className="gap-1">
              <CardDescription>{metric.title}</CardDescription>
              <CardTitle className="text-2xl">{metric.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <CardTitle>{t("settings.org.title")}</CardTitle>
          <CardDescription>{t("settings.org.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {errorMessage}
            </div>
          ) : null}

          {!errorMessage && noticeMessage ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {noticeMessage}
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t("settings.org.form.orgName")}</p>

            {editing ? (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={orgNameDraft}
                  onChange={(event) => setOrgNameDraft(event.target.value)}
                  className="max-w-sm"
                />
                <Button onClick={() => void handleSave()} disabled={saving || loading}>
                  {saving ? t("common.saving") : t("common.save")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setOrgNameDraft(settings.orgName);
                  }}
                  disabled={saving}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm">{settings.orgName}</p>
                <Button variant="outline" onClick={() => setEditing(true)} disabled={loading || saving}>
                  {t("common.edit")}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
