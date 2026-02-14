import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSettingsStore } from "@/stores/settings-store";

export function CompanyPage() {
  const { t } = useTranslation();
  const {
    settings,
    load,
    upsertCompany,
    removeCompany,
    loading,
    saving,
    errorMessage,
    noticeMessage,
  } = useSettingsStore();

  const [short, setShort] = useState("");
  const [full, setFull] = useState("");
  const [editingShort, setEditingShort] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedCompanies = useMemo(
    () => [...settings.companies].sort((left, right) => left.short.localeCompare(right.short, "zh-Hans-CN")),
    [settings.companies],
  );

  const resetForm = () => {
    setShort("");
    setFull("");
    setEditingShort(null);
  };

  const handleSave = async () => {
    const ok = await upsertCompany(
      {
        short,
        full,
      },
      editingShort ?? undefined,
    );

    if (ok) {
      resetForm();
    }
  };

  const handleDelete = async (companyShort: string) => {
    if (!window.confirm(t("settings.company.dialog.deleteConfirm", { short: companyShort }))) {
      return;
    }

    await removeCompany(companyShort);
    if (editingShort === companyShort) {
      resetForm();
    }
  };

  return (
    <section className="grid gap-4">
      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <CardTitle>{t("settings.company.title")}</CardTitle>
          <CardDescription>{t("settings.company.description")}</CardDescription>
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

          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
            <label className="grid gap-1 text-sm">
              <span>{t("settings.company.form.short")}</span>
              <Input
                value={short}
                onChange={(event) => setShort(event.target.value)}
                disabled={saving || loading}
                placeholder={t("settings.company.form.shortPlaceholder")}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>{t("settings.company.form.full")}</span>
              <Input
                value={full}
                onChange={(event) => setFull(event.target.value)}
                disabled={saving || loading}
                placeholder={t("settings.company.form.fullPlaceholder")}
              />
            </label>

            <Button onClick={() => void handleSave()} disabled={saving || loading}>
              {saving ? t("common.saving") : editingShort ? t("common.update") : t("common.add")}
            </Button>

            <Button variant="outline" onClick={resetForm} disabled={saving || loading}>
              {t("common.cancel")}
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("settings.company.table.short")}</TableHead>
                <TableHead>{t("settings.company.table.full")}</TableHead>
                <TableHead className="text-right">{t("settings.company.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCompanies.map((company) => (
                <TableRow key={company.short}>
                  <TableCell>{company.short}</TableCell>
                  <TableCell>{company.full}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShort(company.short);
                          setFull(company.full);
                          setEditingShort(company.short);
                        }}
                      >
                        {t("common.edit")}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => void handleDelete(company.short)}>
                        {t("common.delete")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {sortedCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    {t("settings.company.empty")}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
