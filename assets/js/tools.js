/* Shipping tools: dimensional-weight calculator and savings estimator. */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const zh = () => document.documentElement.lang === "zh";
  const num = (el) => Math.max(0, parseFloat(el.value) || 0);
  const fmt = (n, d = 0) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  const money = (n, d = 0) => "$" + fmt(n, d);

  /* ----- dimensional weight ----- */
  const L = $("#dL"), W = $("#dW"), H = $("#dH"), WT = $("#dWt"), DIV = $("#dDiv"), DIVC = $("#dDivCustom");
  const IN_PER_CM = 1 / 2.54, LB_PER_KG = 2.20462;
  const metric = () => document.querySelector('input[name="dimUnit"]:checked').value === "metric";

  function calcDim() {
    const m = metric();
    const toIn = (v) => (m ? v * IN_PER_CM : v);
    // carriers typically round each dimension to the nearest inch
    const l = Math.round(toIn(num(L))), w = Math.round(toIn(num(W))), h = Math.round(toIn(num(H)));
    const actualLb = m ? num(WT) * LB_PER_KG : num(WT);
    const divisor = DIV.value === "custom" ? Math.max(1, num(DIVC)) : +DIV.value;
    const cuIn = l * w * h;
    // USPS commonly applies DIM pricing only above 1 cubic foot (1,728 cu in)
    const dimApplies = !(DIV.value === "166" && cuIn <= 1728);
    const dimLb = dimApplies ? Math.ceil(cuIn / divisor) : 0;
    const actualBill = Math.ceil(actualLb);
    const billLb = Math.max(actualBill, dimLb);
    const showWt = (lb) => (m ? `${fmt(lb, 0)} lb · ${fmt(lb / LB_PER_KG, 1)} kg` : `${fmt(lb, 0)} lb`);

    $("#oVol").textContent = m ? `${fmt(cuIn / 61.0237, 0)} L` : `${fmt(cuIn)} in³`;
    $("#oDim").textContent = dimApplies ? showWt(dimLb) : "—";
    $("#oBill").textContent = cuIn || actualBill ? showWt(billLb) : "—";
    const note = $("#oNote");
    if (!dimApplies) note.textContent = zh() ? "该包裹不超过 1 立方英尺，USPS 通常不按体积重计费，按实际重量计费。" : "At or under 1 cubic foot, USPS usually doesn't apply dimensional pricing — you're billed on actual weight.";
    else if (dimLb > actualBill) note.textContent = zh() ? `体积重高于实际重量 ${fmt(dimLb - actualBill)} 磅 —— 缩小包装可能直接降低运费。` : `Dimensional weight is ${fmt(dimLb - actualBill)} lb above actual weight — a smaller box could lower your cost.`;
    else note.textContent = zh() ? "按实际重量计费，包装尺寸合理。" : "Billed on actual weight — your packaging size is efficient.";
  }
  document.querySelectorAll('input[name="dimUnit"]').forEach((r) => r.addEventListener("change", () => {
    const m = metric();
    // convert the current values so the box stays the same size
    [L, W, H].forEach((el) => { el.value = fmt(m ? num(el) * 2.54 : num(el) / 2.54, 1).replace(/,/g, ""); });
    WT.value = fmt(m ? num(WT) / LB_PER_KG : num(WT) * LB_PER_KG, 1).replace(/,/g, "");
    document.querySelectorAll(".u-len").forEach((u) => (u.textContent = m ? "cm" : "in"));
    document.querySelectorAll(".u-wt").forEach((u) => (u.textContent = m ? "kg" : "lb"));
    calcDim();
  }));
  DIV.addEventListener("change", () => { $("#dDivCustomWrap").hidden = DIV.value !== "custom"; calcDim(); });
  [L, W, H, WT, DIVC].forEach((el) => el.addEventListener("input", calcDim));

  /* ----- savings estimator ----- */
  const Q = $("#sQty"), C = $("#sCost"), P = $("#sPct");
  function calcSave() {
    const pct = +P.value / 100, qty = num(Q), cost = num(C);
    P.style.setProperty("--p", ((P.value - P.min) / (P.max - P.min)) * 100 + "%");
    $("#sPctOut").textContent = P.value + "%";
    $("#oNew").textContent = money(cost * (1 - pct), 2);
    $("#oMonth").textContent = money(qty * cost * pct);
    $("#oYear").textContent = money(qty * cost * pct * 12);
  }
  [Q, C, P].forEach((el) => el.addEventListener("input", calcSave));

  // language toggle re-renders the explanatory note
  const t = document.querySelector(".lang-toggle");
  if (t) t.addEventListener("click", () => setTimeout(calcDim, 0));
  calcDim(); calcSave();
})();
