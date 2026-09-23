/* Shared language handling for the simple standalone pages (privacy, 404). */
(() => {
  "use strict";
  const url = new URLSearchParams(location.search).get("lang");
  let saved = null;
  try { saved = localStorage.getItem("inno-lang"); } catch (e) { /* storage unavailable */ }
  let lang = (url === "zh" || url === "en") ? url
    : saved || ((navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en");

  const apply = () => {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-l]").forEach((el) => { el.hidden = el.dataset.l !== lang; });
    document.querySelectorAll(".lang-toggle [data-lang]").forEach((s) => s.classList.toggle("is-on", s.dataset.lang === lang));
    const title = document.querySelector(`meta[name="title-${lang}"]`);
    if (title) document.title = title.content;
    // carry the language to links back to the home page
    document.querySelectorAll("a[data-home]").forEach((a) => { a.href = "/" + (lang === "zh" ? "?lang=zh" : "") + (a.dataset.home || ""); });
  };
  const toggle = document.querySelector(".lang-toggle");
  if (toggle) toggle.addEventListener("click", () => {
    lang = lang === "zh" ? "en" : "zh";
    try { localStorage.setItem("inno-lang", lang); } catch (e) { /* ignore */ }
    apply();
  });
  apply();
})();
