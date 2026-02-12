import { useTranslation } from "react-i18next";
import { Outlet, useLocation } from "react-router-dom";

import { AppHeader } from "@/components/layout/app-header";
import { NavPanel } from "@/components/layout/nav-panel";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { getRouteMeta } from "@/router/app-routes";
import { useAppStore } from "@/stores/app-store";
import type { AppLanguage } from "@/types/payroll";

export function AppLayout() {
  const { t } = useTranslation();
  const location = useLocation();

  const routeMeta = getRouteMeta(location.pathname);
  const language = useAppStore((state) => state.language);
  const navPanelOpen = useAppStore((state) => state.navPanelOpen);
  const selectedMonth = useAppStore((state) => state.selectedMonth);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const setNavPanelOpen = useAppStore((state) => state.setNavPanelOpen);
  const toggleNavPanel = useAppStore((state) => state.toggleNavPanel);
  const setSelectedMonth = useAppStore((state) => state.setSelectedMonth);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader
        language={language}
        onToggleMenu={toggleNavPanel}
        onLanguageChange={(value) => setLanguage(value as AppLanguage)}
      />

      <NavPanel open={navPanelOpen} onClose={() => setNavPanelOpen(false)} />

      <main className="mx-auto max-w-[1600px] px-4 pb-10 pt-[76px] sm:px-6">
        <div className="mb-6 flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>{t("app.overview")}</BreadcrumbItem>

              {routeMeta.category && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>{t(`nav.category.${routeMeta.category}`)}</BreadcrumbItem>
                </>
              )}

              {routeMeta.groupKey && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>{t(routeMeta.groupKey)}</BreadcrumbItem>
                </>
              )}

              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t(routeMeta.titleKey)}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {routeMeta.showMonthPicker && (
            <label className="inline-flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t("app.month")}</span>
              <Input
                type="month"
                className="w-40"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
              />
            </label>
          )}
        </div>

        <Outlet />
      </main>
    </div>
  );
}
