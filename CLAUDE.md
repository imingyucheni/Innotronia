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
`slug` (lowercase-hyphenated English, unique), `date` (today, YYYY-MM-DD, Los Angeles time), `title_en`, `title_zh`, `desc_en` (140–160 chars), `desc_zh` (60–80 汉字), `category_en`, `category_zh`, `read_min` (int), `keywords_en` (4–6), `keywords_zh` (4–6), `body_en`, `body_zh`.

Categories (EN / ZH) — use one of: `Industry news`/`行业动态`, `Amazon`/`Amazon`, `Walmart`/`Walmart`, `TikTok Shop`/`TikTok Shop`, `Temu & SHEIN`/`Temu 与 SHEIN`, `Shipping & logistics`/`物流运费`, `Going global`/`出海美国`, `Ads & growth`/`广告与增长`, `Choosing an agency`/`选择服务商`. (Colours are in `CAT_COLOR` in `scripts/build_pages.py`; add one there if you truly need a new category.)

Body rules:
- Allowed tags only: `h2, h3, p, ul, ol, li, strong, em, a, blockquote, table, thead, tbody, tr, th, td`; `<blockquote class="tip">` for a highlighted tip. No h1, no inline styles, no images, no scripts.
- EN 700–1,100 words; ZH equivalent, written naturally for Chinese cross-border sellers (简体, 行业常用说法), not a literal translation.
- Structure: 2–3 sentence hook → h2 sections → concrete actions/checklist → closing h2 that connects to how Atronia Innovations helps (≤ 90 words, 1–2 internal links such as `/#contact`, `/#pricing`, `/#logistics`, `/#accelerator`, `/tools/shipping.html`, or another article `/insights/<slug>.html`).
- News articles: state dates explicitly ("On Sept 18, 2026, Amazon announced…"), separate facts from our analysis ("What it means for sellers" / "我们的解读"), and end with an h2 **Sources / 信息来源** listing the sources as `<a href="…" rel="nofollow noopener" target="_blank">Publisher — title (date)</a>`.
- **Accuracy is mandatory**: no invented statistics, prices, dates, quotes or legal guarantees. If a detail varies or may change, say so and point to the official source. Don't name or disparage competitor agencies.
- Company facts you may use (don't invent others): Channel Takeover $999/mo for ≤10 SKUs + $199 setup + 1% of ad-generated sales (returns not deducted), +$499/mo per extra 10 SKUs, custom above 50; Channel Expansion 5% of net revenue (gross minus returns), no setup fee for strong catalogs; Brand Accelerator (terms discussed case by case); Creative Studio +$699/mo; 3-month minimum then 30 days' notice; account access by user invitation (never passwords); clients pay ad spend/samples/inventory per our proposal; discounted carrier labels — US last-mile UniUni, GOFO, SwiftX, USPS; international FedEx, UPS, ePost, DHL; pickup arranged with our help or by the client; offices in Los Angeles and Shenzhen; 12+ years team experience; $100M+ client revenue generated; $10M+ ad spend managed.

### 3. Build & check
1. `python3 scripts/build_pages.py`
2. Validate: both JSON files parse; the new pages exist in `insights/`; `sitemap.xml` lists them; no `<script`, `style=` or `<img` inside the bodies; internal links point to existing paths.
3. Quick render check if possible (Chromium is at `/opt/pw-browsers/chromium`; serve with `python3 -m http.server`) — the page loads without JS errors in EN and ZH.

### 4. Publish
`git add content/insights insights sitemap.xml` (plus anything else you intentionally changed), commit `Insights: <title A> / <title B>` and `git push origin claude/blissful-galileo-1q4d77` (on rejection: `git pull --rebase` then push again; retry network failures up to 4 times with backoff).

### 5. Report
Finish with a short summary in Chinese: the two titles (中文 + English), their URLs (`https://innotronia.com/insights/<slug>.html`), the sources used for the news article, and anything you were unsure about. If you could not find a verifiable news topic, publish two evergreen articles instead and say so.
