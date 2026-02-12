import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface ModulePlaceholderPageProps {
  titleKey: string;
  descriptionKey?: string;
}

export function ModulePlaceholderPage({ titleKey, descriptionKey = "app.comingSoon" }: ModulePlaceholderPageProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader>
        <CardTitle className="text-xl">{t(titleKey)}</CardTitle>
        <CardDescription>{t(descriptionKey)}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{t("app.p0Hint")}</p>
      </CardContent>
    </Card>
  );
}
