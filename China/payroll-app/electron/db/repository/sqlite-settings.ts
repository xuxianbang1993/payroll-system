import type Database from "better-sqlite3";

import type { RepositorySettings } from "./contracts.js";
import {
  createDefaultSettings,
  normalizeRepositorySettings,
} from "./defaults.js";
import { ensureCompanies, parseJsonRecord } from "./sqlite-shared.js";

const ORG_NAME_KEY = "orgName";
const SOCIAL_KEY = "social";

interface SqliteSettingsActions {
  getSettings: () => RepositorySettings;
  saveSettings: (settingsInput: RepositorySettings) => void;
}

export function createSqliteSettingsActions(db: Database.Database): SqliteSettingsActions {
  const upsertSetting = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = CURRENT_TIMESTAMP;
  `);

  const getSettings = (): RepositorySettings => {
    const defaults = createDefaultSettings();

    const orgRow = db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get(ORG_NAME_KEY) as { value?: string } | undefined;

    const socialRow = db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get(SOCIAL_KEY) as { value?: string } | undefined;

    const companies = db
      .prepare("SELECT short, full FROM companies ORDER BY short COLLATE NOCASE ASC")
      .all() as Array<{ short: string; full: string }>;

    return {
      orgName: orgRow?.value?.trim() || defaults.orgName,
      social: socialRow?.value
        ? normalizeRepositorySettings({ social: parseJsonRecord(socialRow.value) }).social
        : defaults.social,
      companies: companies.map((company) => ({
        short: company.short,
        full: company.full,
      })),
    };
  };

  const saveSettings = (settingsInput: RepositorySettings): void => {
    const settings = normalizeRepositorySettings(settingsInput);

    const run = db.transaction(() => {
      upsertSetting.run(ORG_NAME_KEY, settings.orgName);
      upsertSetting.run(SOCIAL_KEY, JSON.stringify(settings.social));
      ensureCompanies(db, settings.companies);
    });

    run();
  };

  return {
    getSettings,
    saveSettings,
  };
}
