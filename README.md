# Innotronia Website

Static, bilingual (EN / 中文) marketing site for Innotronia: e-commerce agency services and logistics (US last-mile and international parcels).

No build step. Open `index.html` or deploy the folder to any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages).

## Structure

```
index.html            All page content (English is written here)
assets/css/style.css  Styles (colors/fonts are variables at the top)
assets/js/i18n.js     Chinese translations + A–Z stage descriptions
assets/js/main.js     Interactions, pricing calculators, survey, form sending
assets/img/           Favicon
```

## Contact forms

Both forms (shipping survey and e-commerce consultation) post to [FormSubmit](https://formsubmit.co), which forwards them to the company inbox. No server needed. The address is not shown anywhere on the site.

**One-time activation:** after the site is live, submit a form once. FormSubmit sends a confirmation email to the inbox. Click **Activate Form**, and after that every submission arrives in the inbox.

After activation, FormSubmit also provides a random alias string. Put it in `FORM_ALIAS` at the top of `assets/js/main.js` so the real address is removed from the site code entirely. To change the recipient, edit `inbox` in the same place.

Each person who submits a form also gets an automatic confirmation email (`AUTO_REPLY` in `main.js`, English or Chinese depending on the site language).

## Editing content

- **English text:** edit `index.html` directly.
- **Chinese text:** edit the matching key in `assets/js/i18n.js` (each element's key is in its `data-i18n` attribute).
- **Pricing logic:** `updateCalc()` in `assets/js/main.js` ($999 base for ≤10 SKUs, +$499 per extra 10 SKUs, custom above 50, $199 setup, optional Creative Studio add-on `CREATIVE_FEE` = $699/mo).
- **Strategy selector (profit / balanced / volume):** meter levels in `STRATEGY` (`main.js`), text in `STRATEGY_COPY` (`i18n.js`).
- **Platform logos:** inline SVG in the `#platforms` section of `index.html`. Amazon, Walmart and TikTok marks come from Simple Icons; Wayfair, Temu and SHEIN are simplified lockups in brand colours. Swap in official files from each platform's brand/partner kit if you have them.
- **Shipping volume ranges:** `VOLUMES` in `assets/js/main.js`.

## Hosting (GitHub Pages + innotronia.com)

`CNAME` (contains `innotronia.com`) and `.nojekyll` are already in the repo.

1. GitHub → repo **Settings → Pages** → Source: *Deploy from a branch* → select the site branch, folder `/ (root)` → Save.
   (Pages on a private repo needs GitHub Pro / Team, or make the repo public.)
2. Custom domain: `innotronia.com` → Save. Tick **Enforce HTTPS** once the certificate is issued.
3. DNS at your domain registrar:

   | Type  | Host | Value |
   |-------|------|-------|
   | A     | @    | 185.199.108.153 |
   | A     | @    | 185.199.109.153 |
   | A     | @    | 185.199.110.153 |
   | A     | @    | 185.199.111.153 |
   | AAAA  | @    | 2606:50c0:8000::153 (and ::8001, ::8002, ::8003 — optional) |
   | CNAME | www  | imingyucheni.github.io |

   Remove any other A / CNAME records on `@` and `www` (e.g. registrar parking pages). **Do not touch MX records** — they deliver the company email.
4. After the site is live, submit a form once and click **Activate Form** in the FormSubmit email.

## SEO & sharing

- `sitemap.xml`, `robots.txt`, canonical + hreflang links, and Organization/Service structured data (JSON-LD) in `index.html`.
- Chinese version is shareable as `https://innotronia.com/?lang=zh`.
- Social share image: `assets/img/og-image.png` (1200×630). App icon: `assets/img/apple-touch-icon.png`.
- `404.html` (custom not-found page) and `privacy.html` (privacy policy, EN/中文).

## Local preview

```
python3 -m http.server 8000
# open http://localhost:8000
```
