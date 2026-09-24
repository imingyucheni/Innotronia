/* =========================================================
   Atronia Innovations — interactions
   ========================================================= */
(() => {
  "use strict";

  /* ---------- config ---------- */
  // Where form submissions are delivered, via FormSubmit (https://formsubmit.co).
  // The first submission sends an activation email to the inbox — click it once.
  // After activation, FormSubmit gives you a random alias (e.g. "a1b2c3…"); put it in
  // FORM_ALIAS so the real address never appears in the site code.
  const FORM_ALIAS = "";
  const inbox = ["info", "innotronia.com"].join("@"); // assembled at runtime to keep scrapers off it
  const FORM_ENDPOINT = `https://formsubmit.co/ajax/${FORM_ALIAS || inbox}`;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

  /* ---------- i18n ---------- */
  // English strings that only exist in JS (the rest live in the HTML).
  const EN = {
    "calc.custom": "More than 50 SKUs? Contact us for a tailored plan.",
    "calc.customPrice": "Custom",
    "calc.note": "Starter covers up to 10 SKUs. Each additional 10 SKUs adds $499/mo.",
    "calc.extra": "{n} SKUs: $999 base + {k} × $499 add-on.",
    "calc.withCreative": "incl. Creative Studio",
    "survey.pick": "Please choose an option to continue.",
    "f.required": "Please enter your name and a valid email address.",
    "err.send": "Sorry, the message couldn't be sent. Please check your connection and try again in a moment.",
    "survey.parcels": "parcels",
    "survey.day": "day",
    "survey.month": "month",
    "book.loading": "Loading calendar…"
  };
  // Saved choice wins; otherwise follow the browser language.
  let saved = null;
  try { saved = localStorage.getItem("inno-lang"); } catch (e) { /* storage unavailable */ }
  // ?lang=zh / ?lang=en in the URL wins (shareable links), then the saved choice, then the browser language.
  const urlLang = new URLSearchParams(location.search).get("lang");
  let lang = (urlLang === "zh" || urlLang === "en") ? urlLang
    : saved || ((navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en");
  if (urlLang === "zh" || urlLang === "en") { try { localStorage.setItem("inno-lang", urlLang); } catch (e) { /* ignore */ } }
  const META = {
    en: { title: document.title, desc: document.querySelector('meta[name="description"]').content },
    zh: { title: "Atronia Innovations — 电商代运营与物流服务", desc: "Atronia Innovations 团队拥有 12 年以上电商运营经验，提供 Amazon、Walmart、Wayfair、Overstock、Temu、SHEIN、TikTok Shop 渠道接管与全托管运营、新渠道开拓、创意设计（主图、A+、视频），以及美国尾程派送与国际包裹物流服务。" }
  };
  const t = (key) => (lang === "zh" && window.I18N.zh[key]) || EN[key] || key;

  function applyLang() {
    document.documentElement.lang = lang === "zh" ? "zh" : "en";
    document.title = META[lang].title;
    document.querySelector('meta[name="description"]').content = META[lang].desc;
    document.querySelector('link[rel="canonical"]').href = "https://innotronia.com/" + (lang === "zh" ? "?lang=zh" : "");
    $$("[data-i18n]").forEach((el) => {
      if (el.dataset.en === undefined) el.dataset.en = el.textContent;
      const zh = window.I18N.zh[el.dataset.i18n];
      el.textContent = lang === "zh" && zh ? zh : el.dataset.en;
    });
    $$("[data-i18n-html]").forEach((el) => {
      if (el.dataset.en === undefined) el.dataset.en = el.innerHTML;
      const zh = window.I18N.zh[el.dataset.i18nHtml];
      el.innerHTML = lang === "zh" && zh ? zh : el.dataset.en;
    });
    $$(".lang-toggle [data-lang]").forEach((s) => s.classList.toggle("is-on", s.dataset.lang === lang));
    renderStep(currentStep, false);
    renderStrategy(stMode, false);
    updateCalc();
    renderVolumes();
    renderSummary();
    moveInk();
  }

  $("#langToggle").addEventListener("click", () => {
    lang = lang === "zh" ? "en" : "zh";
    try { localStorage.setItem("inno-lang", lang); } catch (e) { /* ignore */ }
    // keep the address bar in sync so the current language can be shared
    const u = new URL(location.href);
    if (lang === "zh") u.searchParams.set("lang", "zh"); else u.searchParams.delete("lang");
    history.replaceState(null, "", u.pathname + u.search + u.hash);
    applyLang();
  });

  /* ---------- nav ---------- */
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const burger = $("#burger");
  const mobileMenu = $("#mobileMenu");
  const setMenu = (open) => {
    burger.setAttribute("aria-expanded", String(open));
    mobileMenu.classList.toggle("is-open", open);
  };
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  $$("a", mobileMenu).forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ---------- section tracking: top nav, side rail, mobile quick menu ---------- */
  const rail = $("#rail"), quick = $("#quick"), quickBtn = $("#quickBtn");
  const navLinks = $$(".nav__links a");
  const jumpLinks = $$("[data-sec]");
  // the hero counts as "top"; everything between tracked sections inherits the previous one
  const TRACKED = ["hero", "platforms", "services", "strategy", "pricing", "accelerator", "logistics", "why", "faq", "contact"];
  const trackedEls = TRACKED.map((id) => document.getElementById(id)).filter(Boolean);
  let currentSec = "";
  function setCurrent(id) {
    if (id === currentSec) return;
    currentSec = id;
    const key = id === "hero" ? "top" : id;
    jumpLinks.forEach((a) => a.classList.toggle("is-current", a.dataset.sec === key));
    navLinks.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === "#" + key));
  }
  function onScrollTrack() {
    const y = window.scrollY, vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    document.documentElement.style.setProperty("--scroll", max > 0 ? Math.min(y / max, 1).toFixed(4) : 0);
    const show = y > vh * 0.6;
    rail.classList.toggle("is-on", show);
    quick.classList.toggle("is-on", show);
    if (!show) setQuick(false);
    // current = last section whose top has passed 40% of the viewport
    let cur = trackedEls[0].id;
    for (const el of trackedEls) if (el.getBoundingClientRect().top <= vh * 0.4) cur = el.id;
    if (max - y < 4) cur = trackedEls[trackedEls.length - 1].id;
    setCurrent(cur);
  }
  let trackQueued = false;
  window.addEventListener("scroll", () => {
    if (trackQueued) return;
    trackQueued = true;
    requestAnimationFrame(() => { trackQueued = false; onScrollTrack(); });
  }, { passive: true });
  window.addEventListener("resize", onScrollTrack);
  onScrollTrack();

  function setQuick(open) {
    quickBtn.setAttribute("aria-expanded", String(open));
    quick.classList.toggle("is-open", open);
  }
  quickBtn.addEventListener("click", () => setQuick(quickBtn.getAttribute("aria-expanded") !== "true"));
  $$("#quickPanel a").forEach((a) => a.addEventListener("click", () => setQuick(false)));
  document.addEventListener("click", (e) => { if (!quick.contains(e.target)) setQuick(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setQuick(false); });

  /* ---------- reveal on scroll ---------- */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      revealObs.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  // stagger siblings
  $$(".reveal").forEach((el) => {
    const sibs = $$(":scope > .reveal", el.parentElement);
    const i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty("--d", Math.min(i * 0.08, 0.4) + "s");
    revealObs.observe(el);
  });

  /* ---------- counters ---------- */
  const countObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target, to = +el.dataset.to, start = performance.now(), dur = 1400;
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      reduceMotion ? (el.textContent = to) : requestAnimationFrame(tick);
      countObs.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$(".count").forEach((el) => countObs.observe(el));

  /* ---------- cursor glow, magnetic buttons, tilt cards ---------- */
  if (finePointer && !reduceMotion) {
    const glow = $(".cursor-glow");
    let gx = -1000, gy = -1000, cx = gx, cy = gy;
    window.addEventListener("pointermove", (e) => { gx = e.clientX; gy = e.clientY; }, { passive: true });
    (function loop() {
      cx += (gx - cx) * 0.12; cy += (gy - cy) * 0.12;
      glow.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    })();

    $$(".magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });

    $$(".tilt").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
        card.style.transform = `perspective(1000px) rotateX(${(0.5 - py) * 5}deg) rotateY(${(px - 0.5) * 7}deg)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  /* ---------- hero globe ---------- */
  (function globe() {
    const canvas = $("#globe");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0, R = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height; R = Math.min(W, H) * 0.42;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // fibonacci sphere of dots
    const N = window.innerWidth < 700 ? 600 : 1100, pts = []; // lighter on phones
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), th = golden * i;
      pts.push([Math.cos(th) * rad, y, Math.sin(th) * rad]);
    }
    const ll = (lat, lon) => {
      const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
      return [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)];
    };
    const hubs = {
      la: ll(34, -118), nyc: ll(40.7, -74), chi: ll(41.9, -87.6), dal: ll(32.8, -96.8), mia: ll(25.8, -80.2),
      sh: ll(31.2, 121.5), sz: ll(22.5, 114), ldn: ll(51.5, -0.1), tor: ll(43.7, -79.4), syd: ll(-33.9, 151.2), mex: ll(19.4, -99.1)
    };
    const routes = [["sz", "la"], ["sh", "la"], ["la", "nyc"], ["la", "chi"], ["dal", "mia"], ["chi", "nyc"], ["la", "dal"], ["nyc", "ldn"], ["la", "syd"], ["nyc", "tor"], ["dal", "mex"], ["sh", "ldn"]]
      .map(([a, b], i) => ({ a: hubs[a], b: hubs[b], off: i * 0.37, rgb: ["139,108,255", "255,61,139", "255,162,74", "46,230,214"][i % 4] }));

    const slerp = (a, b, t) => {
      const d = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
      if (d < 1e-6) return a;
      const s = Math.sin(d), k1 = Math.sin((1 - t) * d) / s, k2 = Math.sin(t * d) / s;
      const lift = 1 + Math.sin(Math.PI * t) * d * 0.07;
      return [(a[0] * k1 + b[0] * k2) * lift, (a[1] * k1 + b[1] * k2) * lift, (a[2] * k1 + b[2] * k2) * lift];
    };

    const tiltX = 0.32;
    let rot = 3.1, mouseX = 0, targetMouse = 0, visible = true;
    window.addEventListener("pointermove", (e) => { targetMouse = (e.clientX / window.innerWidth - 0.5) * 0.6; }, { passive: true });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

    const project = (p) => {
      const a = rot + mouseX;
      let x = p[0] * Math.cos(a) - p[2] * Math.sin(a);
      let z = p[0] * Math.sin(a) + p[2] * Math.cos(a);
      let y = p[1] * Math.cos(tiltX) - z * Math.sin(tiltX);
      z = p[1] * Math.sin(tiltX) + z * Math.cos(tiltX);
      return [W / 2 + x * R, H / 2 - y * R, z];
    };

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(now - last, 50); last = now;
      if (visible && !document.hidden) {
        if (!reduceMotion) rot += dt * 0.00006;
        mouseX += (targetMouse - mouseX) * 0.03;
        ctx.clearRect(0, 0, W, H);

        // atmosphere
        const g = ctx.createRadialGradient(W / 2, H / 2, R * 0.85, W / 2, H / 2, R * 1.25);
        g.addColorStop(0, "rgba(139,108,255,0.18)"); g.addColorStop(1, "rgba(255,61,139,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W / 2, H / 2, R * 1.25, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(180,160,255,0.22)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(W / 2, H / 2, R, 0, Math.PI * 2); ctx.stroke();

        // dots
        for (const p of pts) {
          const [x, y, z] = project(p);
          if (z < -0.05) continue;
          ctx.fillStyle = `rgba(214,206,255,${0.08 + z * 0.55})`;
          ctx.fillRect(x, y, 1.3 + z * 0.6, 1.3 + z * 0.6);
        }

        // routes
        const time = now * 0.00012;
        for (const r of routes) {
          ctx.beginPath();
          let started = false;
          for (let i = 0; i <= 48; i++) {
            const [x, y, z] = project(slerp(r.a, r.b, i / 48));
            if (z < 0) { started = false; continue; }
            started ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
            started = true;
          }
          ctx.strokeStyle = `rgba(${r.rgb},0.45)`; ctx.lineWidth = 1.2; ctx.stroke();

          const tt = (time + r.off) % 1;
          const [px, py, pz] = project(slerp(r.a, r.b, tt));
          if (pz > 0) {
            const pg = ctx.createRadialGradient(px, py, 0, px, py, 8);
            pg.addColorStop(0, `rgba(${r.rgb},1)`); pg.addColorStop(1, `rgba(${r.rgb},0)`);
            ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill();
          }
        }
        // hubs
        for (const h of Object.values(hubs)) {
          const [x, y, z] = project(h);
          if (z < 0) continue;
          ctx.fillStyle = `rgba(255,255,255,${0.5 + z * 0.5})`;
          ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = `rgba(255,61,139,${0.45 * z})`;
          ctx.beginPath(); ctx.arc(x, y, 6 + ((now * 0.01) % 8), 0, Math.PI * 2); ctx.stroke();
        }
      }
      requestAnimationFrame(frame);
    }
    // start after the page has loaded so the globe never delays first paint
    const start = () => requestAnimationFrame(frame);
    if (document.readyState === "complete") start(); else window.addEventListener("load", start, { once: true });
  })();

  /* ---------- A–Z process ---------- */
  const stepBtns = $$(".step");
  const stepPanel = $(".step-panel");
  let currentStep = 0, autoTimer = null, autoOn = !reduceMotion;

  function renderStep(i, animate = true) {
    currentStep = i;
    const [title, desc] = window.AZ_STEPS[lang][i];
    stepBtns.forEach((b, j) => { b.classList.toggle("is-active", j === i); b.setAttribute("aria-selected", String(j === i)); });
    const write = () => {
      $("#stepN").textContent = String(i + 1).padStart(2, "0");
      $("#stepTitle").textContent = title;
      $("#stepDesc").textContent = desc;
      $("#stepBar").style.width = ((i + 1) / stepBtns.length) * 100 + "%";
      stepPanel.classList.remove("is-swapping");
    };
    if (animate) { stepPanel.classList.add("is-swapping"); setTimeout(write, 220); } else write();
  }
  stepBtns.forEach((b) => b.addEventListener("click", () => {
    autoOn = false; clearInterval(autoTimer);
    renderStep(+b.dataset.step);
    if (window.innerWidth <= 700) b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }));
  new IntersectionObserver(([e]) => {
    clearInterval(autoTimer);
    if (e.isIntersecting && autoOn) autoTimer = setInterval(() => renderStep((currentStep + 1) % stepBtns.length), 4500);
  }, { threshold: 0.4 }).observe($(".process__body"));

  /* ---------- strategy selector ---------- */
  // Meter levels (0–100) for: ad investment, price positioning, promotion intensity, inventory depth.
  const STRATEGY = {
    profit:   { levels: [35, 85, 25, 55], grad: "linear-gradient(90deg,#2ee6d6,#4f8bff)", shadow: "rgba(46,230,214,.5)", glow: "rgba(46,230,214,.18)" },
    balanced: { levels: [60, 65, 55, 70], grad: "linear-gradient(90deg,#8b6cff,#ff3d8b)", shadow: "rgba(139,108,255,.55)", glow: "rgba(139,108,255,.22)" },
    volume:   { levels: [90, 40, 85, 90], grad: "linear-gradient(90deg,#ff3d8b,#ffa24a)", shadow: "rgba(255,61,139,.55)", glow: "rgba(255,61,139,.2)" }
  };
  const stBtns = $$(".st__btn"), stPanel = $(".st__panel"), stSection = $(".strategy");
  let stMode = "balanced";
  function renderStrategy(mode, animate = true) {
    stMode = mode;
    const cfg = STRATEGY[mode], copy = window.STRATEGY_COPY[lang][mode];
    stBtns.forEach((b) => { const on = b.dataset.mode === mode; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", String(on)); });
    stSection.style.setProperty("--st-glow", cfg.glow);
    stPanel.style.setProperty("--st-grad", cfg.grad);
    stPanel.style.setProperty("--st-shadow", cfg.shadow);
    const write = () => {
      $("#stTitle").textContent = copy.title;
      $("#stDesc").textContent = copy.desc;
      $("#stKpi").textContent = copy.kpi;
      $("#stBest").textContent = copy.best;
      stPanel.classList.remove("is-swapping");
    };
    $$(".meter", stPanel).forEach((m, i) => {
      $(".meter__track span", m).style.width = (stSeen ? cfg.levels[i] : 0) + "%";
      $(".meter__v", m).textContent = copy.levels[i];
    });
    if (animate) { stPanel.classList.add("is-swapping"); setTimeout(write, 200); } else write();
  }
  stBtns.forEach((b) => b.addEventListener("click", () => renderStrategy(b.dataset.mode)));
  // fill the meters the first time the panel scrolls into view
  let stSeen = false;
  const stObs = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    stSeen = true; renderStrategy(stMode, false); stObs.disconnect();
  }, { threshold: 0.35 });
  stObs.observe(stPanel);

  /* ---------- pricing calculators ---------- */
  const skuRange = $("#skuRange"), revRange = $("#revRange"), creativeToggle = $("#creativeToggle");
  const CREATIVE_FEE = 699;
  const setFill = (input) => {
    const p = ((input.value - input.min) / (input.max - input.min)) * 100;
    input.style.setProperty("--p", p + "%");
  };
  function updateCalc() {
    const n = +skuRange.value;
    setFill(skuRange);
    const note = $("#calcNote");
    const currency = $(".plan--featured .plan__currency"), per = $(".plan--featured .plan__per");
    if (n > 50) {
      $("#skuOut").textContent = "50+";
      $("#calcMonthly").textContent = t("calc.customPrice");
      currency.style.visibility = "hidden"; per.style.visibility = "hidden";
      $("#calcTerm").textContent = "—";
      note.textContent = t("calc.custom"); note.classList.add("is-custom");
      return;
    }
    const extraBlocks = Math.max(0, Math.ceil((n - 10) / 10));
    const monthly = 999 + extraBlocks * 499 + (creativeToggle.checked ? CREATIVE_FEE : 0);
    currency.style.visibility = ""; per.style.visibility = "";
    $("#skuOut").textContent = n;
    $("#calcMonthly").textContent = monthly.toLocaleString("en-US");
    $("#calcTerm").textContent = money(199 + monthly * 3);
    note.classList.remove("is-custom");
    note.textContent = (extraBlocks ? t("calc.extra").replace("{n}", n).replace("{k}", extraBlocks) : t("calc.note"))
      + (creativeToggle.checked ? ` (${t("calc.withCreative")} +$699)` : "");
  }
  function updateRev() {
    setFill(revRange);
    const v = +revRange.value;
    $("#revOut").textContent = money(v);
    $("#revFee").textContent = money(v * 0.05);
  }
  skuRange.addEventListener("input", updateCalc);
  creativeToggle.addEventListener("change", updateCalc);
  revRange.addEventListener("input", updateRev);
  updateRev();

  /* ---------- contact tabs ---------- */
  const tabs = $$(".tab");
  const ink = $(".tabs__ink");
  const panels = $$(".panel");
  function moveInk() {
    const active = $(".tab.is-active");
    if (!active) return;
    ink.style.width = active.offsetWidth + "px";
    ink.style.transform = `translateX(${active.offsetLeft - 5}px)`;
  }
  function showPanel(name) {
    panels.forEach((p) => p.classList.toggle("is-active", p.dataset.panel === name));
  }

  /* ---------- Calendly booking ----------
     Only offered on the thank-you screen after a form is sent, prefilled with the sender's
     name and email. The Calendly script loads at that moment, not on page load. */
  const CALENDLY_URL = "https://calendly.com/innotronia-info/30min";
  let lastContact = { name: "", email: "" };
  const calendlyUrl = () => {
    const q = new URLSearchParams({ hide_gdpr_banner: "1", locale: lang === "zh" ? "zh" : "en", name: lastContact.name, email: lastContact.email });
    return `${CALENDLY_URL}?${q}`;
  };
  let calendlyReady = null;
  function loadCalendly() {
    if (calendlyReady) return calendlyReady;
    calendlyReady = new Promise((resolve, reject) => {
      const css = document.createElement("link");
      css.rel = "stylesheet"; css.href = "https://assets.calendly.com/assets/external/widget.css";
      document.head.appendChild(css);
      const js = document.createElement("script");
      js.src = "https://assets.calendly.com/assets/external/widget.js"; js.async = true;
      js.onload = () => (window.Calendly ? resolve(window.Calendly) : reject(new Error("Calendly missing")));
      js.onerror = reject;
      document.head.appendChild(js);
      setTimeout(() => reject(new Error("Calendly timeout")), 10000);
    });
    calendlyReady.catch(() => { calendlyReady = null; $("#bookPanel").classList.add("is-failed"); });
    return calendlyReady;
  }
  function mountBooking() {
    const box = $("#calendlyInline"), panel = $("#bookPanel");
    panel.classList.remove("is-failed");
    $(".book__fallback a", panel).href = calendlyUrl();
    box.innerHTML = `<div class="book__loading"><span class="book__spinner" aria-hidden="true"></span><span>${t("book.loading")}</span></div>`;
    loadCalendly().then((C) => { box.innerHTML = ""; C.initInlineWidget({ url: calendlyUrl(), parentElement: box }); }).catch(() => {});
  }
  function selectTab(name) {
    tabs.forEach((tb) => { const on = tb.dataset.tab === name; tb.classList.toggle("is-active", on); tb.setAttribute("aria-selected", String(on)); });
    showPanel(name);
    moveInk();
  }
  tabs.forEach((tb) => tb.addEventListener("click", () => selectTab(tb.dataset.tab)));
  window.addEventListener("resize", moveInk);

  $$("[data-tab-target]").forEach((a) => a.addEventListener("click", () => {
    selectTab(a.dataset.tabTarget);
    if (a.dataset.plan) {
      const map = { takeover: "Channel Takeover", expansion: "Channel Expansion", enterprise: "Enterprise (50+ SKUs)", accelerator: "Brand Accelerator" };
      const r = $(`#ecomForm input[name="plan"][value="${map[a.dataset.plan]}"]`);
      if (r) r.checked = true;
      const wantsCreative = a.dataset.creative === "1" || (a.dataset.plan === "takeover" && creativeToggle.checked);
      if (wantsCreative) $('#ecomForm input[name="creative"]').checked = true;
      // carry the SKU count from the pricing slider into the form
      if (a.dataset.plan === "takeover") {
        const n = +skuRange.value;
        const bucket = n <= 10 ? "1–10" : n <= 20 ? "11–20" : n <= 30 ? "21–30" : n <= 50 ? "31–50" : "50+";
        const sk = $(`#ecomForm input[name="skus"][value="${bucket}"]`);
        if (sk) sk.checked = true;
      }
      syncAccelFields();
    }
  }));

  /* ---------- shipping survey ---------- */
  const survey = $("#surveyForm");
  const qs = $$(".q", survey);
  const backBtn = $("#surveyBack"), nextBtn = $("#surveyNext"), sendBtn = $("#surveySend");
  let q = 0;

  const VOLUMES = {
    Daily: ["< 50", "50–200", "200–500", "500–1,000", "1,000+"],
    Monthly: ["< 1,000", "1,000–5,000", "5,000–20,000", "20,000–50,000", "50,000+"]
  };
  let lastPeriod = "Daily";
  function renderVolumes() {
    const period = $('input[name="period"]:checked', survey).value;
    const prev = ($('input[name="volume"]:checked', survey) || {}).value;
    // switching per-day / per-month keeps the same bucket position instead of clearing the answer
    const idx = prev ? VOLUMES[lastPeriod].indexOf(prev) : -1;
    const keep = idx >= 0 ? VOLUMES[period][idx] : prev;
    lastPeriod = period;
    $("#volOptions").innerHTML = VOLUMES[period].map((v) => `
      <label class="opt"><input type="radio" name="volume" value="${v}" ${v === keep ? "checked" : ""}/>
      <span class="opt__body"><strong>${v}</strong><small>${t("survey.parcels")}</small></span></label>`).join("");
  }
  $$('input[name="period"]', survey).forEach((r) => r.addEventListener("change", renderVolumes));

  const val = (name) => ($(`input[name="${name}"]:checked`, survey) || {}).value;
  const labelFor = (name) => {
    const input = $(`input[name="${name}"]:checked`, survey);
    return input ? ($("strong", input.nextElementSibling) || input.nextElementSibling).textContent : "";
  };
  function renderSummary() {
    const box = $("#surveySummary");
    if (!box) return;
    const period = $('input[name="period"]:checked', survey);
    const items = [
      [0, labelFor("service")],
      [1, labelFor("size")],
      [2, val("volume") ? `${val("volume")} ${t("survey.parcels")} / ${t(period.value === "Daily" ? "survey.day" : "survey.month")}` : ""]
    ].filter(([, v]) => v);
    box.innerHTML = items.map(([i, v]) => `<button type="button" data-goto="${i}">${v}</button>`).join("");
    $$("button", box).forEach((b) => b.addEventListener("click", () => { editing = true; goTo(+b.dataset.goto, true); }));
  }

  let editing = false; // opened a step from the summary chips → return to the summary afterwards
  function goTo(i, focus = false) {
    const back = i < q;
    q = i;
    qs.forEach((f, j) => { f.classList.toggle("is-active", j === q); f.classList.toggle("is-back", back && j === q); });
    $("#surveyBar").style.width = ((q + 1) / qs.length) * 100 + "%";
    $("#surveyStepNum").textContent = q + 1;
    backBtn.style.visibility = q === 0 ? "hidden" : "visible";
    nextBtn.hidden = q === qs.length - 1;
    sendBtn.hidden = q !== qs.length - 1;
    $("#surveyConsent").hidden = q !== qs.length - 1;
    hideError(survey);
    if (q === qs.length - 1) renderSummary();
    if (focus) { const lg = $(".q__title", qs[q]); lg.setAttribute("tabindex", "-1"); lg.focus({ preventScroll: true }); }
  }
  const required = ["service", "size", "volume"];
  function next() {
    if (q < required.length && !val(required[q])) return showError(survey, t("survey.pick"));
    const target = editing ? qs.length - 1 : Math.min(q + 1, qs.length - 1);
    if (target === qs.length - 1) editing = false;
    goTo(target, true);
  }
  nextBtn.addEventListener("click", next);
  backBtn.addEventListener("click", () => goTo(Math.max(q - 1, 0)));
  // Auto-advance only when a card is tapped/clicked. Arrow keys just move the selection
  // (Enter continues), so keyboard users can reach the option they want.
  let tap = null;
  survey.addEventListener("pointerdown", (e) => {
    const opt = e.target.closest(".opt");
    tap = opt ? { input: $("input", opt), wasChecked: $("input", opt).checked } : null;
  });
  survey.addEventListener("change", (e) => {
    if (!["service", "size", "volume"].includes(e.target.name)) return;
    if (tap && tap.input === e.target) { tap = null; setTimeout(next, 280); }
  });
  // tapping the answer that is already selected (e.g. when editing) also moves on
  survey.addEventListener("click", (e) => {
    if (e.target.tagName === "INPUT" && tap && tap.input === e.target && tap.wasChecked) { tap = null; setTimeout(next, 200); }
  });
  // Enter in a text input on the last step shouldn't skip validation
  survey.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && q < qs.length - 1 && e.target.tagName !== "TEXTAREA") { e.preventDefault(); next(); }
  });

  /* ---------- validation + submit ---------- */
  function showError(form, msg) {
    const box = $(".form-error", form);
    box.textContent = msg;
    box.hidden = false;
  }
  function hideError(form) { $(".form-error", form).hidden = true; }

  function validContact(form) {
    const name = $('input[name="name"]', form), email = $('input[name="email"]', form);
    const okName = name.value.trim().length > 0;
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    name.parentElement.classList.toggle("is-invalid", !okName);
    email.parentElement.classList.toggle("is-invalid", !okEmail);
    if (!okName) name.focus(); else if (!okEmail) email.focus();
    return okName && okEmail;
  }
  $$(".field input").forEach((i) => i.addEventListener("input", () => i.parentElement.classList.remove("is-invalid")));

  // Confirmation email FormSubmit sends to the person who submitted the form.
  const AUTO_REPLY = {
    en: "Thank you for contacting Atronia Innovations! We've received your inquiry and our team will get back to you within one business day.\n\nThis is an automatic confirmation — no need to reply.\n\n— The Atronia Innovations Team\nhttps://innotronia.com",
    zh: "感谢您联系 Atronia Innovations！我们已收到您的咨询，团队会在一个工作日内与您联系。\n\n这是一封自动确认邮件，无需回复。\n\n— Atronia Innovations 团队\nhttps://innotronia.com"
  };

  async function send(form, payload, btn) {
    hideError(form);
    if ($('input[name="_honey"]', form).value) return; // bot
    btn.classList.add("is-loading"); btn.disabled = true;
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...payload, _template: "table", _captcha: "false", _autoresponse: AUTO_REPLY[lang] })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) === "false") throw new Error(data.message || res.statusText);
      lastContact = { name: payload["Name"] || "", email: payload.email || "" };
      form.reset();
      syncAccelFields();
      renderVolumes();
      showPanel("success");
      mountBooking();
      $("#success").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    } catch (err) {
      console.error(err);
      showError(form, t("err.send"));
    } finally {
      btn.classList.remove("is-loading"); btn.disabled = false;
    }
  }

  const fieldVal = (form, name) => (($(`[name="${name}"]`, form) || {}).value || "").trim() || "—";

  /* ---------- lead analysis ----------
     Each inquiry is scored and summarised (in Chinese, for the Atronia Innovations team) before it is sent,
     so the email opens with: priority, one-line summary, estimated value, missing info, next step. */
  const has = (v) => v && v !== "—";
  const TIER_NEXT = {
    A: "高意向：建议 24 小时内电话 / 微信联系，并准备报价方案",
    B: "中等意向：建议 1 个工作日内邮件回复，同时补问缺少的信息",
    C: "信息较少：先邮件回复了解具体需求，再给报价"
  };
  const tierOf = (score, a, b) => (score >= a ? "A" : score >= b ? "B" : "C");
  const TIER_LABEL = { A: "A · 高意向", B: "B · 中等意向", C: "C · 待了解" };
  const replyLang = (l) => (l === "zh" ? "客户使用中文页面，建议用中文回复" : "客户使用英文页面，建议用英文回复");
  const contactPoints = (d, reasons, missing) => {
    let n = 0;
    if (has(d.company)) { n++; reasons.push("留了公司名"); } else missing.push("公司 / 品牌名");
    if (has(d.phone)) { n++; reasons.push("留了电话 / 微信"); } else missing.push("电话 / 微信");
    if (has(d.message) && d.message.length >= 20) { n++; reasons.push("附有详细留言"); }
    return n;
  };
  const report = (tier, score, reasons, summary, value, missing, nextStep, l) => ({
    "① 线索等级": `${TIER_LABEL[tier]}（${score} 分）${reasons.length ? " — " + reasons.join("、") : ""}`,
    "② 一句话摘要": summary,
    "③ 预估价值": value,
    "④ 缺少信息": missing.length ? missing.join("、") : "无，信息完整",
    "⑤ 建议下一步": `${nextStep}。${replyLang(l)}`,
    "⬇ 以下为客户原始填写内容": "—"
  });

  const TAKEOVER_FEE = { "1–10": [999, 999], "11–20": [1498, 1498], "21–30": [1997, 1997], "31–50": [2496, 2995] };
  const PLAN_ZH = { "Channel Takeover": "渠道接管", "Channel Expansion": "新渠道开拓", "Enterprise (50+ SKUs)": "企业定制（50+ SKU）", "Brand Accelerator": "品牌加速器（深度合作）", "Not sure yet": "未确定方案" };
  const GOAL_ZH = { "Profit-first": "重利润", "Balanced": "利润销量平衡", "Volume-first": "重销量" };
  const range$ = ([lo, hi]) => (lo === hi ? money(lo) : `${money(lo)}–${money(hi)}`);

  function analyzeEcom(d) {
    let score = 0; const reasons = [], missing = [];
    if (d.plan !== "Not sure yet") { score += 2; reasons.push(`已选方案「${PLAN_ZH[d.plan]}」`); } else missing.push("意向方案");
    if (d.skus === "50+") { score += 3; reasons.push("SKU 50+（大客户）"); }
    else if (d.skus === "31–50") { score += 2; reasons.push("SKU 31–50"); }
    else if (has(d.skus)) score += 1; else missing.push("SKU 数量");
    if (d.platforms.length >= 3) { score += 2; reasons.push(`${d.platforms.length} 个平台`); }
    else if (d.platforms.length) score += 1; else missing.push("运营平台");
    if (d.creative) { score += 1; reasons.push("需要创意设计"); }
    if (has(d.goal)) score += 1; else missing.push("经营目标");
    if (d.plan === "Brand Accelerator") {
      score += 1;
      if (d.revenue === "$5–20M" || d.revenue === "$20M+") { score += 2; reasons.push(`年营业额 ${d.revenue}`); }
    }
    score += contactPoints(d, reasons, missing);
    const tier = tierOf(score, 7, 4);

    const summary = ["电商咨询", PLAN_ZH[d.plan], d.platforms.length ? d.platforms.join("、") : "", has(d.skus) ? `${d.skus} 个 SKU` : "",
      d.creative ? "含创意设计" : "", has(d.goal) ? `目标：${GOAL_ZH[d.goal]}` : ""].filter(Boolean).join("｜");

    let value;
    const addon = d.creative ? 699 : 0;
    if (d.plan === "Brand Accelerator") { value = "品牌加速器深度合作：合作模式（按业绩 / 营收分成 / 组合）需面谈，建议先了解产品、现有销售与品牌规划"; }
    else if (d.skus === "50+" || d.plan === "Enterprise (50+ SKUs)") value = "定制报价（50+ SKU），需沟通具体渠道与产品数量";
    else if (d.plan === "Channel Expansion") value = "按新渠道净营业额 5% 收费；需了解客户目前 / 预期月销售额";
    else if (TAKEOVER_FEE[d.skus]) {
      const fee = TAKEOVER_FEE[d.skus].map((x) => x + addon);
      value = `${d.plan === "Channel Takeover" ? "" : "若选渠道接管："}约 ${range$(fee)}/月${d.creative ? "（含创意设计 $699）" : ""} + $199 开户费 + 1% 广告营业额；首期 3 个月合同约 ${range$(fee.map((x) => 199 + 3 * x))}`;
    } else value = "暂无法估算（缺少 SKU 数量）";

    return report(tier, score, reasons, summary, value, missing, TIER_NEXT[tier], lang);
  }

  const DAILY = ["< 50", "50–200", "200–500", "500–1,000", "1,000+"];
  const MONTHLY = ["< 1,000", "1,000–5,000", "5,000–20,000", "20,000–50,000", "50,000+"];
  const DAILY_AS_MONTH = ["约 1,500 件以下 / 月", "约 1,500–6,000 件 / 月", "约 6,000–15,000 件 / 月", "约 15,000–30,000 件 / 月", "约 30,000 件以上 / 月"];
  const SERVICE_ZH = { "US Last-Mile Delivery": "美国尾程派送", "International Parcel": "国际包裹" };
  const SIZE_ZH = { Small: "小件", Medium: "中件", Large: "大件" };

  function analyzeShipping(d) {
    let score = 0; const reasons = [], missing = [];
    const daily = d.period === "Daily";
    const i = (daily ? DAILY : MONTHLY).indexOf(d.volume);
    score += daily ? i + 1 : i;
    if (i >= 3) { score += 2; reasons.push("大货量"); }
    if (d.size === "Large") { score += 1; reasons.push("大件（单票价值高）"); }
    score += contactPoints(d, reasons, missing);
    const detail = [["zip", "发货地邮编"], ["weight", "平均重量"], ["carrier", "现用物流商"], ["software", "发货软件"]];
    const given = detail.filter(([k]) => has(d[k]));
    if (given.length >= 2) { score += 1; reasons.push("提供了报价细节"); }
    detail.filter(([k]) => !has(d[k])).forEach(([, zh]) => missing.push(zh));
    if (!has(d.message)) missing.push("目的地 / 尺寸 / 住宅件比例（留言为空）");
    const tier = tierOf(score, 6, 3);
    const vol = `${d.volume} 件 / ${daily ? "天" : "月"}${daily ? `（${DAILY_AS_MONTH[i]}）` : ""}`;
    const summary = `运费报价｜${SERVICE_ZH[d.service]}｜${SIZE_ZH[d.size]}｜${vol}`;
    const value = `月发货量${daily ? DAILY_AS_MONTH[i] : ` ${d.volume} 件 / 月`}；按${SIZE_ZH[d.size]}${SERVICE_ZH[d.service]}报价`;
    const next = `${TIER_NEXT[tier]}（准备${SIZE_ZH[d.size]}${SERVICE_ZH[d.service]}报价）`;
    return report(tier, score, reasons, summary, value, missing, next, lang);
  }

  survey.addEventListener("submit", (e) => {
    e.preventDefault();
    if (q !== qs.length - 1) return next();
    if (!validContact(survey)) return showError(survey, t("f.required"));
    const lead = analyzeShipping({
      service: val("service"), size: val("size"), volume: val("volume"), period: val("period"),
      company: fieldVal(survey, "company"), phone: fieldVal(survey, "phone"), message: fieldVal(survey, "message"),
      zip: fieldVal(survey, "zip"), weight: fieldVal(survey, "weight"), carrier: fieldVal(survey, "carrier"), software: fieldVal(survey, "software")
    });
    send(survey, {
      _subject: `[${lead["① 线索等级"][0]}] 运费报价 — ${SERVICE_ZH[val("service")]} · ${fieldVal(survey, "company") !== "—" ? fieldVal(survey, "company") : fieldVal(survey, "name")}`,
      ...lead,
      "Inquiry type": "Shipping quote",
      "Service": val("service"),
      "Parcel size": val("size"),
      "Volume": `${val("volume")} parcels / ${val("period") === "Daily" ? "day" : "month"}`,
      "Name": fieldVal(survey, "name"),
      "Company": fieldVal(survey, "company"),
      "email": fieldVal(survey, "email"),
      "Phone": fieldVal(survey, "phone"),
      "Ship-from ZIP": fieldVal(survey, "zip"),
      "Avg. weight (lb)": fieldVal(survey, "weight"),
      "Current carrier": fieldVal(survey, "carrier"),
      "Shipping software / API": fieldVal(survey, "software"),
      "Message": fieldVal(survey, "message"),
      "Site language": lang
    }, sendBtn);
  });

  const ecomForm = $("#ecomForm");
  // Accelerator applicants get a few extra questions
  function syncAccelFields() {
    const on = (($('input[name="plan"]:checked', ecomForm) || {}).value) === "Brand Accelerator";
    $("#accelFields").hidden = !on;
  }
  $$('input[name="plan"]', ecomForm).forEach((r) => r.addEventListener("change", syncAccelFields));
  ecomForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validContact(ecomForm)) return showError(ecomForm, t("f.required"));
    const plan = ($('input[name="plan"]:checked', ecomForm) || {}).value || "Not sure yet";
    const platformList = $$('input[name="platforms"]:checked', ecomForm).map((c) => c.value);
    const platforms = platformList.join(", ") || "—";
    const creative = $('input[name="creative"]', ecomForm).checked;
    const goal = (($('input[name="goal"]:checked', ecomForm) || {}).value) || "—";
    const skus = (($('input[name="skus"]:checked', ecomForm) || {}).value) || "—";
    const lead = analyzeEcom({
      plan, platforms: platformList, creative, goal, skus,
      company: fieldVal(ecomForm, "company"), phone: fieldVal(ecomForm, "phone"), message: fieldVal(ecomForm, "message"),
      revenue: (($('input[name="revenue"]:checked', ecomForm) || {}).value) || "—"
    });
    const accel = plan === "Brand Accelerator" ? {
      "Current markets": fieldVal(ecomForm, "markets"),
      "Annual revenue": (($('input[name="revenue"]:checked', ecomForm) || {}).value) || "—",
      "US entity": (($('input[name="entity"]:checked', ecomForm) || {}).value) || "—",
      "Certifications": fieldVal(ecomForm, "certs")
    } : {};
    send(ecomForm, {
      _subject: `[${lead["① 线索等级"][0]}] 电商咨询 — ${PLAN_ZH[plan]} · ${fieldVal(ecomForm, "company") !== "—" ? fieldVal(ecomForm, "company") : fieldVal(ecomForm, "name")}`,
      ...lead,
      "Inquiry type": "E-commerce consultation",
      "Plan": plan,
      "Creative Studio add-on": creative ? "Yes (+$699/mo)" : "No",
      "Main goal": goal,
      "Platforms": platforms,
      "SKUs": skus,
      ...accel,
      "Name": fieldVal(ecomForm, "name"),
      "Company / Brand": fieldVal(ecomForm, "company"),
      "email": fieldVal(ecomForm, "email"),
      "Phone": fieldVal(ecomForm, "phone"),
      "Message": fieldVal(ecomForm, "message"),
      "Site language": lang
    }, $('button[type="submit"]', ecomForm));
  });

  $("#successReset").addEventListener("click", () => {
    const active = $(".tab.is-active").dataset.tab;
    showPanel(active);
    if (active === "shipping") goTo(0);
  });

  /* ---------- office local clocks ---------- */
  const clocks = $$(".office__time");
  function tickClocks() {
    clocks.forEach((el) => {
      try {
        el.textContent = new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", { hour: "numeric", minute: "2-digit", timeZone: el.dataset.tz }).format(new Date());
      } catch (e) { el.textContent = ""; }
    });
  }
  tickClocks();
  setInterval(tickClocks, 30000);
  $("#langToggle").addEventListener("click", tickClocks);

  /* ---------- init ---------- */
  $("#year").textContent = new Date().getFullYear();
  renderVolumes();
  goTo(0);
  applyLang();
  // fonts can shift tab widths
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInk);
})();
