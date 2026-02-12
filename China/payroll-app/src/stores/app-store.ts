import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import type { AppLanguage } from "@/types/payroll";

const defaultMonth = new Date().toISOString().slice(0, 7);

const memoryStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const safeStorage = createJSONStorage(() => {
  if (
    typeof window !== "undefined" &&
    window.localStorage &&
    typeof window.localStorage.getItem === "function" &&
    typeof window.localStorage.setItem === "function" &&
    typeof window.localStorage.removeItem === "function"
  ) {
    return window.localStorage;
  }

  return memoryStorage;
});

interface AppStore {
  language: AppLanguage;
  navPanelOpen: boolean;
  selectedMonth: string;
  setLanguage: (language: AppLanguage) => void;
  setNavPanelOpen: (open: boolean) => void;
  toggleNavPanel: () => void;
  setSelectedMonth: (month: string) => void;
  hydrateExternalState: (state: { language?: string; selectedMonth?: string }) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      language: "zh-CN",
      navPanelOpen: false,
      selectedMonth: defaultMonth,
      setLanguage: (language) => set({ language }),
      setNavPanelOpen: (navPanelOpen) => set({ navPanelOpen }),
      toggleNavPanel: () => set((state) => ({ navPanelOpen: !state.navPanelOpen })),
      setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
      hydrateExternalState: (state) => {
        if (!state.language && !state.selectedMonth) {
          return;
        }

        set({
          language: (state.language as AppLanguage | undefined) ?? "zh-CN",
          selectedMonth: state.selectedMonth ?? defaultMonth,
        });
      },
    }),
    {
      name: "payroll-ui",
      storage: safeStorage,
      partialize: (state) => ({
        language: state.language,
        selectedMonth: state.selectedMonth,
      }),
    },
  ),
);
