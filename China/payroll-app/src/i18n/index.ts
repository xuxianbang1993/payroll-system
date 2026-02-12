import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "@/i18n/locales/en/common.json";
import zhCN from "@/i18n/locales/zh-CN/common.json";
import zhHK from "@/i18n/locales/zh-HK/common.json";

const resources = {
  en: { translation: en },
  "zh-CN": { translation: zhCN },
  "zh-HK": { translation: zhHK },
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "zh-CN",
    supportedLngs: ["zh-CN", "zh-HK", "en"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
