import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { AppLanguage } from "@/types/payroll";

interface AppHeaderProps {
  language: AppLanguage;
  onToggleMenu: () => void;
  onLanguageChange: (language: AppLanguage) => void;
}

const languageOptions: AppLanguage[] = ["zh-HK", "zh-CN", "en"];

export function AppHeader({ language, onToggleMenu, onLanguageChange }: AppHeaderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto grid h-[58px] max-w-[1320px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
        <div className="flex items-center gap-2 justify-self-start">
          <Button variant="ghost" className="h-10 gap-2 rounded-md px-2.5 text-base font-semibold" onClick={() => navigate("/")}>
            <span className="inline-flex size-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              薪
            </span>
            <span className="text-xl font-semibold tracking-tight">{t("app.name")}</span>
          </Button>
          <Button variant="outline" size="icon-sm" onClick={onToggleMenu} aria-label={t("nav.menu")}>
            <Menu className="size-5" />
          </Button>
        </div>

        <div className="hidden md:flex justify-self-center">
          <span className="inline-flex h-9 items-center rounded-full border border-border bg-card px-5 text-sm text-muted-foreground">
            {t("app.overview")}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 min-w-[118px] justify-self-end rounded-full text-xs">
              {t(`language.${language}`)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {languageOptions.map((option) => (
              <DropdownMenuItem key={option} onClick={() => onLanguageChange(option)}>
                {t(`language.${option}`)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
