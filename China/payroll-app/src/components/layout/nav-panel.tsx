import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { navCategories } from "@/config/navigation";
import type { NavCategoryId } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getRouteMeta } from "@/router/app-routes";

interface NavPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NavPanel({ open, onClose }: NavPanelProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const activeRoute = getRouteMeta(location.pathname);
  const defaultCategory = (activeRoute.category ?? "settings") as NavCategoryId;

  const [selectedCategory, setSelectedCategory] = useState<NavCategoryId>(defaultCategory);

  const activeCategory = useMemo(
    () => navCategories.find((category) => category.id === selectedCategory) ?? navCategories[0],
    [selectedCategory],
  );

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30">
      <button className="absolute inset-0 bg-black/26 backdrop-blur-[1px]" onClick={onClose} aria-label={t("nav.close")} />

      <div className="absolute left-0 right-0 top-[58px] mx-auto max-w-[1320px] px-4 sm:px-6">
        <section className="grid w-full max-w-[760px] grid-cols-[196px_1fr] overflow-hidden rounded-2xl border border-border bg-popover [box-shadow:var(--shadow-soft)]">
          <aside className="border-r border-border bg-secondary/65 p-3">
            <div className="space-y-1">
              {navCategories.map((category) => (
                <Button
                  key={category.id}
                  variant="ghost"
                  className={cn(
                    "h-9 w-full justify-start rounded-md px-2.5 text-sm text-muted-foreground",
                    category.id === activeCategory.id && "bg-card font-semibold text-foreground shadow-xs",
                  )}
                  onMouseEnter={() => setSelectedCategory(category.id)}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {t(category.titleKey)}
                </Button>
              ))}
            </div>

            <div className="my-3 border-t border-border/80" />
            <p className="px-2 text-xs text-muted-foreground">{t("nav.system")}</p>
          </aside>

          <div className="grid gap-5 bg-card/90 p-5 sm:grid-cols-2">
            {activeCategory.groups.map((group) => (
              <section key={group.titleKey}>
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">{t(group.titleKey)}</h3>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Button
                      key={item.path}
                      variant="ghost"
                      className="h-8 w-full justify-start rounded-md px-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                      onClick={() => {
                        navigate(item.path);
                        onClose();
                      }}
                    >
                      {t(item.titleKey)}
                    </Button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
