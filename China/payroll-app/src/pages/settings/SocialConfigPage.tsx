import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSettingsStore } from "@/stores/settings-store";
import type { SocialConfig } from "@/types/payroll";

interface SocialField {
  key: keyof SocialConfig;
  labelKey: string;
  unitKey: string;
}

const employerRateFields: SocialField[] = [
  { key: "compPension", labelKey: "settings.social.fields.compPension", unitKey: "settings.social.units.percent" },
  {
    key: "compLocalPension",
    labelKey: "settings.social.fields.compLocalPension",
    unitKey: "settings.social.units.percent",
  },
  { key: "compUnemploy", labelKey: "settings.social.fields.compUnemploy", unitKey: "settings.social.units.percent" },
  { key: "compMedical", labelKey: "settings.social.fields.compMedical", unitKey: "settings.social.units.percent" },
  { key: "compInjury", labelKey: "settings.social.fields.compInjury", unitKey: "settings.social.units.percent" },
  { key: "compMaternity", labelKey: "settings.social.fields.compMaternity", unitKey: "settings.social.units.percent" },
];

const workerRateFields: SocialField[] = [
  { key: "workerPension", labelKey: "settings.social.fields.workerPension", unitKey: "settings.social.units.percent" },
  {
    key: "workerUnemploy",
    labelKey: "settings.social.fields.workerUnemploy",
    unitKey: "settings.social.units.percent",
  },
  { key: "workerMedical", labelKey: "settings.social.fields.workerMedical", unitKey: "settings.social.units.percent" },
];

const baseFields: SocialField[] = [
  { key: "pensionBase", labelKey: "settings.social.fields.pensionBase", unitKey: "settings.social.units.yuan" },
  {
    key: "unemploymentBase",
    labelKey: "settings.social.fields.unemploymentBase",
    unitKey: "settings.social.units.yuan",
  },
  { key: "medicalBase", labelKey: "settings.social.fields.medicalBase", unitKey: "settings.social.units.yuan" },
  { key: "injuryBase", labelKey: "settings.social.fields.injuryBase", unitKey: "settings.social.units.yuan" },
  { key: "maternityBase", labelKey: "settings.social.fields.maternityBase", unitKey: "settings.social.units.yuan" },
];

function toNumber(value: string, fallback: number): number {
  if (value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

function formatAmount(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function SocialConfigPage() {
  const { t } = useTranslation();
  const {
    settings,
    load,
    saveSocial,
    loading,
    saving,
    errorMessage,
    noticeMessage,
  } = useSettingsStore();

  const [draft, setDraft] = useState<SocialConfig>(settings.social);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setDraft(settings.social);
  }, [settings.social]);

  const example = useMemo(() => {
    const employerTotal =
      (draft.pensionBase * (draft.compPension + draft.compLocalPension)) / 100 +
      (draft.unemploymentBase * draft.compUnemploy) / 100 +
      (draft.medicalBase * draft.compMedical) / 100 +
      (draft.injuryBase * draft.compInjury) / 100 +
      (draft.maternityBase * draft.compMaternity) / 100;

    const workerTotal =
      (draft.pensionBase * draft.workerPension) / 100 +
      (draft.unemploymentBase * draft.workerUnemploy) / 100 +
      (draft.medicalBase * draft.workerMedical) / 100;

    return {
      employerTotal,
      workerTotal,
    };
  }, [draft]);

  const handleChange = (key: keyof SocialConfig, value: string) => {
    setDraft((prev) => ({
      ...prev,
      [key]: toNumber(value, prev[key]),
    }));
  };

  const handleSave = async () => {
    await saveSocial(draft);
  };

  return (
    <section className="grid gap-4">
      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <CardTitle>{t("settings.social.title")}</CardTitle>
          <CardDescription>{t("settings.social.description")}</CardDescription>
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

          <section className="grid gap-3">
            <h3 className="text-sm font-semibold text-muted-foreground">{t("settings.social.group.employer")}</h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {employerRateFields.map((field) => (
                <label key={field.key} className="grid gap-1 text-sm">
                  <span>{t(field.labelKey)}</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={draft[field.key]}
                      onChange={(event) => handleChange(field.key, event.target.value)}
                      disabled={loading || saving}
                    />
                    <span className="text-xs text-muted-foreground">{t(field.unitKey)}</span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="grid gap-3">
            <h3 className="text-sm font-semibold text-muted-foreground">{t("settings.social.group.worker")}</h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {workerRateFields.map((field) => (
                <label key={field.key} className="grid gap-1 text-sm">
                  <span>{t(field.labelKey)}</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={draft[field.key]}
                      onChange={(event) => handleChange(field.key, event.target.value)}
                      disabled={loading || saving}
                    />
                    <span className="text-xs text-muted-foreground">{t(field.unitKey)}</span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="grid gap-3">
            <h3 className="text-sm font-semibold text-muted-foreground">{t("settings.social.group.base")}</h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {baseFields.map((field) => (
                <label key={field.key} className="grid gap-1 text-sm">
                  <span>{t(field.labelKey)}</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={draft[field.key]}
                      onChange={(event) => handleChange(field.key, event.target.value)}
                      disabled={loading || saving}
                    />
                    <span className="text-xs text-muted-foreground">{t(field.unitKey)}</span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            <p>{t("settings.social.example.title")}</p>
            <p>{t("settings.social.example.employer", { value: formatAmount(example.employerTotal) })}</p>
            <p>{t("settings.social.example.worker", { value: formatAmount(example.workerTotal) })}</p>
          </div>

          <Button onClick={() => void handleSave()} disabled={loading || saving}>
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
