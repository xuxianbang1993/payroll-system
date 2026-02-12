import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { TooltipProvider } from "@/components/ui/tooltip";
import { loadExternalUiState, saveExternalUiState } from "@/lib/electron-store";
import { AppLayout } from "@/layouts/AppLayout";
import { appRoutes } from "@/router/app-routes";
import { useAppStore } from "@/stores/app-store";

function App() {
  const { i18n } = useTranslation();
  const language = useAppStore((state) => state.language);
  const selectedMonth = useAppStore((state) => state.selectedMonth);
  const hydrateExternalState = useAppStore((state) => state.hydrateExternalState);

  useEffect(() => {
    void i18n.changeLanguage(language);
  }, [i18n, language]);

  useEffect(() => {
    void loadExternalUiState().then((state) => {
      if (state) {
        hydrateExternalState(state);
      }
    });
  }, [hydrateExternalState]);

  useEffect(() => {
    void saveExternalUiState({ language, selectedMonth });
  }, [language, selectedMonth]);

  const indexRoute = appRoutes.find((route) => route.path === "/");
  const childRoutes = appRoutes.filter((route) => route.path !== "/");

  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={indexRoute?.element} />
            {childRoutes.map((route) => (
              <Route key={route.path} path={route.path.slice(1)} element={route.element} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
