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
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-[52px] max-w-[1600px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="px-1.5 text-base font-semibold" onClick={() => navigate("/")}>
            {t("app.name")}
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggleMenu} aria-label={t("nav.menu")}>
            <Menu className="size-5" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-8 min-w-28 text-xs">
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
