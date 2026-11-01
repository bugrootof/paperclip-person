import i18n, { type InitOptions, type TOptions } from "i18next";
import { initReactI18next, useTranslation as useReactI18nextTranslation } from "react-i18next";

import { DEFAULT_LOCALE, i18nextResources, supportedLocales } from "./locales";
import boardZhCN from "./board-zh-CN.json";

const i18nextOptions: InitOptions = {
  resources: {
    ...i18nextResources,
    "zh-CN": { ...i18nextResources["zh-CN"], board: boardZhCN },
  },
  lng: import.meta.env.VITE_PAPERCLIP_LOCALE || "zh-CN",
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: supportedLocales,
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  returnObjects: false,
  initAsync: false,
};

void i18n.use(initReactI18next).init(i18nextOptions).catch((error: unknown) => {
  console.error("Failed to initialize i18next", error);
});

if (typeof document !== "undefined") {
  document.documentElement.lang = i18n.resolvedLanguage ?? "zh-CN";
}

export function t(key: string, options: TOptions = {}) {
  return i18n.t(key, options);
}

/** Board copy uses English source text as keys; unknown copy stays readable. */
export function boardT(key: string, options: TOptions = {}) {
  return i18n.t(key, { ns: "board", keySeparator: false, nsSeparator: false, defaultValue: key, ...options });
}

export const useTranslation = useReactI18nextTranslation;
export { i18n };
