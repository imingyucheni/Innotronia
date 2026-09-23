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

## Contact forms → info@innotronia.com

Both forms (shipping survey and e-commerce consultation) post to [FormSubmit](https://formsubmit.co), which forwards to `info@innotronia.com`. No server needed.

**One-time activation:** after the site is live, submit a form once. FormSubmit sends a confirmation email to info@innotronia.com. Click **Activate Form**, and after that every submission arrives in the inbox.

To change the recipient, edit `CONTACT_EMAIL` at the top of `assets/js/main.js`.

## Editing content

- **English text:** edit `index.html` directly.
- **Chinese text:** edit the matching key in `assets/js/i18n.js` (each element's key is in its `data-i18n` attribute).
- **Pricing logic:** `updateCalc()` in `assets/js/main.js` ($999 base for ≤10 SKUs, +$499 per extra 10 SKUs, custom above 50, $199 setup).
- **Shipping volume ranges:** `VOLUMES` in `assets/js/main.js`.

## Local preview

```
python3 -m http.server 8000
# open http://localhost:8000
```
