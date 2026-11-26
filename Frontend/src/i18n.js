import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import ar from "./locales/ar.json";
import ur from "./locales/ur.json";
import hi from "./locales/hi.json";

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  ur: { translation: ur },
  hi: { translation: hi },
};

const savedLang = localStorage.getItem("preferredLanguage") || "en";

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export const updateHtmlDirection = (lang) => {
  const isRTL = lang === "ar" || lang === "ur";
  document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
  document.documentElement.setAttribute("lang", lang);
  localStorage.setItem("preferredLanguage", lang);
};

// Set initial direction
updateHtmlDirection(savedLang);

i18n.on("languageChanged", (lng) => {
  updateHtmlDirection(lng);
});

export default i18n;
