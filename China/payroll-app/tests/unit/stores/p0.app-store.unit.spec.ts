import { beforeEach, describe, expect, it } from "vitest";

import { useAppStore } from "@/stores/app-store";

describe("P0 app store", () => {
  const defaultMonth = () => new Date().toISOString().slice(0, 7);

  beforeEach(() => {
    if (window.localStorage && typeof window.localStorage.clear === "function") {
      window.localStorage.clear();
    }
    useAppStore.setState({
      language: "zh-CN",
      navPanelOpen: false,
      selectedMonth: defaultMonth(),
    });
  });

  it("initial state shape is valid", () => {
    const state = useAppStore.getState();
    expect(state.language).toBe("zh-CN");
    expect(state.navPanelOpen).toBe(false);
    expect(state.selectedMonth).toMatch(/^\d{4}-\d{2}$/);
  });

  it("toggleNavPanel toggles open/close state", () => {
    const { toggleNavPanel } = useAppStore.getState();
    toggleNavPanel();
    expect(useAppStore.getState().navPanelOpen).toBe(true);
    toggleNavPanel();
    expect(useAppStore.getState().navPanelOpen).toBe(false);
  });

  it("hydrateExternalState updates language and month from persisted source", () => {
    const { hydrateExternalState } = useAppStore.getState();
    hydrateExternalState({ language: "en", selectedMonth: "2026-02" });
    const state = useAppStore.getState();
    expect(state.language).toBe("en");
    expect(state.selectedMonth).toBe("2026-02");
  });
});
