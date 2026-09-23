/* =========================================================
   Innotronia — interactions
   ========================================================= */
(() => {
  "use strict";

  /* ---------- config ---------- */
  // Where form submissions are delivered. Uses FormSubmit (https://formsubmit.co):
  // the very first submission sends an activation email to this address — click it once.
  const CONTACT_EMAIL = "info@innotronia.com";
  const FORM_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;

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
    "err.send": "Sorry, something went wrong. Please try again or email us directly at",
    "survey.parcels": "parcels"
  };
  // Saved choice wins; otherwise follow the browser language.
  let saved = null;
  try { saved = localStorage.getItem("inno-lang"); } catch (e) { /* storage unavailable */ }
  let lang = saved || ((navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en");
  const t = (key) => (lang === "zh" && window.I18N.zh[key]) || EN[key] || key;

  function applyLang() {
    document.documentElement.lang = lang === "zh" ? "zh" : "en";
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

  // highlight current section in nav
  const navLinks = $$(".nav__links a");
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["ecommerce", "pricing", "logistics", "brands", "faq"].forEach((id) => { const s = document.getElementById(id); if (s) sectionObs.observe(s); });

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
    const N = 1100, pts = [];
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
      if (visible) {
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
    requestAnimationFrame(frame);
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
      const map = { takeover: "Channel Takeover", expansion: "Channel Expansion", enterprise: "Enterprise (50+ SKUs)" };
      const r = $(`#ecomForm input[name="plan"][value="${map[a.dataset.plan]}"]`);
      if (r) r.checked = true;
      const wantsCreative = a.dataset.creative === "1" || (a.dataset.plan === "takeover" && creativeToggle.checked);
      if (wantsCreative) $('#ecomForm input[name="creative"]').checked = true;
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
  function renderVolumes() {
    const period = $('input[name="period"]:checked', survey).value;
    const prev = ($('input[name="volume"]:checked', survey) || {}).value;
    $("#volOptions").innerHTML = VOLUMES[period].map((v) => `
      <label class="opt"><input type="radio" name="volume" value="${v}" ${v === prev ? "checked" : ""}/>
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
      [2, val("volume") ? `${val("volume")} ${t("survey.parcels")} / ${period.nextElementSibling.textContent}` : ""]
    ].filter(([, v]) => v);
    box.innerHTML = items.map(([i, v]) => `<button type="button" data-goto="${i}">${v}</button>`).join("");
    $$("button", box).forEach((b) => b.addEventListener("click", () => goTo(+b.dataset.goto)));
  }

  function goTo(i) {
    const back = i < q;
    q = i;
    qs.forEach((f, j) => { f.classList.toggle("is-active", j === q); f.classList.toggle("is-back", back && j === q); });
    $("#surveyBar").style.width = ((q + 1) / qs.length) * 100 + "%";
    $("#surveyStepNum").textContent = q + 1;
    backBtn.style.visibility = q === 0 ? "hidden" : "visible";
    nextBtn.hidden = q === qs.length - 1;
    sendBtn.hidden = q !== qs.length - 1;
    hideError(survey);
    if (q === qs.length - 1) renderSummary();
  }
  const required = ["service", "size", "volume"];
  function next() {
    if (q < required.length && !val(required[q])) return showError(survey, t("survey.pick"));
    goTo(Math.min(q + 1, qs.length - 1));
  }
  nextBtn.addEventListener("click", next);
  backBtn.addEventListener("click", () => goTo(Math.max(q - 1, 0)));
  // auto-advance when a choice card is picked
  survey.addEventListener("change", (e) => {
    if (["service", "size", "volume"].includes(e.target.name)) setTimeout(next, 280);
  });
  // Enter in a text input on the last step shouldn't skip validation
  survey.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && q < qs.length - 1 && e.target.tagName !== "TEXTAREA") { e.preventDefault(); next(); }
  });

  /* ---------- validation + submit ---------- */
  function showError(form, msg, withMail = false) {
    const box = $(".form-error", form);
    box.innerHTML = "";
    box.append(msg);
    if (withMail) {
      const a = document.createElement("a");
      a.href = `mailto:${CONTACT_EMAIL}`; a.textContent = CONTACT_EMAIL;
      box.append(" ", a);
    }
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

  async function send(form, payload, btn) {
    hideError(form);
    if ($('input[name="_honey"]', form).value) return; // bot
    btn.classList.add("is-loading"); btn.disabled = true;
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...payload, _template: "table", _captcha: "false" })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) === "false") throw new Error(data.message || res.statusText);
      form.reset();
      renderVolumes();
      showPanel("success");
      $(".contact").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    } catch (err) {
      console.error(err);
      showError(form, t("err.send"), true);
    } finally {
      btn.classList.remove("is-loading"); btn.disabled = false;
    }
  }

  const fieldVal = (form, name) => (($(`[name="${name}"]`, form) || {}).value || "").trim() || "—";

  survey.addEventListener("submit", (e) => {
    e.preventDefault();
    if (q !== qs.length - 1) return next();
    if (!validContact(survey)) return showError(survey, t("f.required"));
    send(survey, {
      _subject: `Shipping quote request — ${val("service")} · ${fieldVal(survey, "company") !== "—" ? fieldVal(survey, "company") : fieldVal(survey, "name")}`,
      "Inquiry type": "Shipping quote",
      "Service": val("service"),
      "Parcel size": val("size"),
      "Volume": `${val("volume")} parcels / ${val("period") === "Daily" ? "day" : "month"}`,
      "Name": fieldVal(survey, "name"),
      "Company": fieldVal(survey, "company"),
      "email": fieldVal(survey, "email"),
      "Phone / WeChat": fieldVal(survey, "phone"),
      "Message": fieldVal(survey, "message"),
      "Site language": lang
    }, sendBtn);
  });

  const ecomForm = $("#ecomForm");
  ecomForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validContact(ecomForm)) return showError(ecomForm, t("f.required"));
    const plan = ($('input[name="plan"]:checked', ecomForm) || {}).value || "Not sure yet";
    const platforms = $$('input[name="platforms"]:checked', ecomForm).map((c) => c.value).join(", ") || "—";
    send(ecomForm, {
      _subject: `E-commerce consultation — ${plan} · ${fieldVal(ecomForm, "company") !== "—" ? fieldVal(ecomForm, "company") : fieldVal(ecomForm, "name")}`,
      "Inquiry type": "E-commerce consultation",
      "Plan": plan,
      "Creative Studio add-on": $('input[name="creative"]', ecomForm).checked ? "Yes (+$699/mo)" : "No",
      "Main goal": (($('input[name="goal"]:checked', ecomForm) || {}).value) || "—",
      "Platforms": platforms,
      "SKUs": (($('input[name="skus"]:checked', ecomForm) || {}).value) || "—",
      "Name": fieldVal(ecomForm, "name"),
      "Company / Brand": fieldVal(ecomForm, "company"),
      "email": fieldVal(ecomForm, "email"),
      "Phone / WeChat": fieldVal(ecomForm, "phone"),
      "Message": fieldVal(ecomForm, "message"),
      "Site language": lang
    }, $('button[type="submit"]', ecomForm));
  });

  $("#successReset").addEventListener("click", () => {
    const active = $(".tab.is-active").dataset.tab;
    showPanel(active);
    if (active === "shipping") goTo(0);
  });

  /* ---------- init ---------- */
  $("#year").textContent = new Date().getFullYear();
  renderVolumes();
  goTo(0);
  applyLang();
  // fonts can shift tab widths
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInk);
})();
