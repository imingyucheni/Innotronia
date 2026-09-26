# Atronia Innovations website — notes for Claude

Static bilingual (EN / 中文) site for **Atronia Innovations** (domain innotronia.com), deployed by GitHub Pages from branch `claude/blissful-galileo-1q4d77`. Every push to that branch goes live within ~2 minutes. See README.md for structure.

- English copy lives in `index.html`; Chinese in `assets/js/i18n.js` (keys = `data-i18n` attributes).
- Insights articles: `content/insights/<slug>.json` → built by `python3 scripts/build_pages.py` into `insights/` + `sitemap.xml`. Never hand-edit files in `insights/`.
- The company email must never appear in page text. Don't add third-party scripts without a reason.

---

## Daily Insights publishing (SOP)

When asked to run the daily publishing task, publish **exactly 2 new articles** following this procedure.

### 0. Sync
`git pull --rebase origin claude/blissful-galileo-1q4d77` before doing anything.

### 1. Pick topics
- Read the titles/keywords of all existing files in `content/insights/` — **never repeat a topic or angle**; a follow-up to a story is fine only if there is genuinely new information, and it must link to the earlier article.
- Article A — **Industry news / trend** (category `Industry news` / `行业动态`, or a platform category): something from roughly the **last 14 days** that US-marketplace sellers or e-commerce shippers care about. Examples of areas: Amazon / Walmart / TikTok Shop / Temu / SHEIN policy or fee changes, peak-season prep and carrier surcharges, USPS/UPS/FedEx rate or service changes, tariffs / customs / de minimis changes, marketplace events (Prime Day, Black Friday), new seller programs.
  Use web search. Prefer official sources (platform seller news / announcements, carrier notices, government sites) and reputable trade press. **Confirm the key facts in at least 2 independent reliable sources.** If you can't verify, pick another topic.
- Article B — **Evergreen how-to** that targets a real search need of our audience (e.g. "Walmart Marketplace approval requirements", "Amazon FBA vs 3PL", "how to lower ACoS", "Temu local seller program", "product liability insurance for Amazon sellers"). Rotate categories so the mix stays balanced across Amazon, Walmart, TikTok Shop, Temu & SHEIN, Shipping & logistics, Going global, Ads & growth, Choosing an agency.
- Both must be clearly useful to our audience: Chinese factories/brands selling or entering the US, US brands, and e-commerce shippers.

### 2. Write (JSON file per article)
Create `content/insights/<slug>.json` (UTF-8, valid JSON, `indent=1`) with keys:
`slug` (lowercase-hyphenated English, unique), `date` (today, YYYY-MM-DD, Los Angeles time), `title_en`, `title_zh`, `desc_en` (140–160 chars), `desc_zh` (60–80 汉字), `category_en`, `category_zh`, `type` (`news` or `guide`), `read_min` (int), `keywords_en` (4–6), `keywords_zh` (4–6), `body_en`, `body_zh`.

Categories (EN / ZH) — use one of: `Industry news`/`行业动态`, `Amazon`/`Amazon`, `Walmart`/`Walmart`, `TikTok Shop`/`TikTok Shop`, `Temu & SHEIN`/`Temu 与 SHEIN`, `Shipping & logistics`/`物流运费`, `Going global`/`出海美国`, `Ads & growth`/`广告与增长`, `Choosing an agency`/`选择服务商`. (Colours are in `CAT_COLOR` in `scripts/build_pages.py`; add one there if you truly need a new category.)

Body rules:
- Allowed tags only: `h2, h3, p, ul, ol, li, strong, em, a, blockquote, table, thead, tbody, tr, th, td, figure, img, figcaption`; `<blockquote class="tip">` for a highlighted tip. No h1, no inline styles, no scripts.
- **Images (图文并茂)**: the cover image is generated automatically by the build — don't add one. Inside the body, images may only be charts made with our helper (below) and must live in `/assets/insights/<slug>/`. **Never** copy, hotlink or re-host photos, logos or screenshots from news sites or platforms (copyright).
- **Data & charts — required in every article**: at least **one chart or one data table** built from real, cited numbers.
  - Chart helper: write a spec JSON in the scratchpad (format documented at the top of `scripts/insights_media.py`; types `bar`, `hbar`, `line`; 1–3 series; ≤ 8 labels), then run `python3 scripts/insights_media.py chart <spec.json>`. It writes `assets/insights/<slug>/<name>-en.svg` / `-zh.svg` and prints the `<figure>` HTML for `body_en` / `body_zh` — paste it right after the paragraph it illustrates. Every chart's `source_en`/`source_zh` names the publisher and date of the numbers.
  - Good data: official figures (US Census quarterly e-commerce report, USPS/UPS/FedEx published rates and surcharges, CBP / USTR / Federal Register tariff notices, platform announcements and fee tables, company earnings releases), and reputable research or trade press (Marketplace Pulse, Digital Commerce 360, eMarketer, Pitney Bowes Parcel Shipping Index, Adobe Digital Economy Index, Reuters, CNBC, Bloomberg).
  - Before/after fee or rate comparisons, year-over-year growth, and category/channel shares make the best charts. A worked example computed from published rules (e.g. DIM weight = L×W×H ÷ 139) is fine if the source says "Calculation: …".
  - Never estimate, round-trip-translate or "fill in" a number to make a chart look complete. If you only have 1–2 numbers, use a small table or a highlighted `<blockquote class="tip">` instead of a chart.
- **Real reporting**: `news` articles must contain **≥ 3 specific data points or facts, each attributed inline** ("according to Amazon's Sept 18 seller announcement…", "据路透社 9 月 20 日报道…") with the link in the text or in Sources, and must cite **≥ 3 external sources**. `guide` articles must include **≥ 1 official figure or rule** with its source and cite **≥ 1 external source**.
- EN 700–1,100 words; ZH equivalent, written naturally for Chinese cross-border sellers (简体, 行业常用说法), not a literal translation.
- Structure: 2–3 sentence hook → h2 sections → concrete actions/checklist → closing h2 that connects to how Atronia Innovations helps (≤ 90 words, 1–2 internal links such as `/#contact`, `/#pricing`, `/#logistics`, `/#accelerator`, `/tools/shipping.html`, or another article `/insights/<slug>.html`).
- News articles: state dates explicitly ("On Sept 18, 2026, Amazon announced…"), separate facts from our analysis ("What it means for sellers" / "我们的解读").
- **Every article** (news and guide) ends with an h2 **Sources** (EN) / **信息来源** (ZH) listing the sources as `<a href="…" rel="nofollow noopener" target="_blank">Publisher — title (date)</a>` — after the Atronia closing section. Every external link anywhere in the body needs `rel="nofollow noopener" target="_blank"`.
- **Accuracy is mandatory**: no invented statistics, prices, dates, quotes or legal guarantees. If a detail varies or may change, say so and point to the official source. Don't name or disparage competitor agencies.
- Company facts you may use (don't invent others): Channel Takeover $999/mo for ≤10 SKUs + $199 setup + 1% of ad-generated sales (returns not deducted), +$499/mo per extra 10 SKUs, custom above 50; Channel Expansion 5% of net revenue (gross minus returns), no setup fee for strong catalogs; Brand Accelerator (terms discussed case by case); Creative Studio +$699/mo; 3-month minimum then 30 days' notice; account access by user invitation (never passwords); clients pay ad spend/samples/inventory per our proposal; discounted carrier labels — US last-mile UniUni, GOFO, SwiftX, USPS; international FedEx, UPS, ePost, DHL; pickup arranged with our help or by the client; offices in Los Angeles and Shenzhen; 12+ years team experience; $100M+ client revenue generated; $10M+ ad spend managed.

### 3. Build & check
1. `python3 scripts/build_pages.py`
2. `python3 scripts/check_insights.py <slug-a> <slug-b>` — must print ✓ for both (checks JSON keys, allowed tags, chart files exist, ≥1 chart/table, source counts, Sources section, internal links, no email addresses, covers + sitemap). Fix and re-run until clean. Older articles are not held to the chart/source rule.
3. Quick render check if possible (Chromium is at `/opt/pw-browsers/chromium`; serve with `python3 -m http.server`) — the page loads without JS errors in EN and ZH, and look at a screenshot of each chart to make sure labels aren't clipped or overlapping.

### 4. Publish
`git add content/insights insights assets/insights sitemap.xml` (plus anything else you intentionally changed), commit `Insights: <title A> / <title B>` and `git push origin claude/blissful-galileo-1q4d77` (on rejection: `git pull --rebase` then push again; retry network failures up to 4 times with backoff).

### 5. Report
Finish with a short summary in Chinese: the two titles (中文 + English), their URLs (`https://innotronia.com/insights/<slug>.html`), the key data points and charts used, the sources for each article, and anything you were unsure about. If you could not find a verifiable news topic, publish two evergreen articles instead and say so.
