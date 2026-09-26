#!/usr/bin/env python3
"""Build the Insights articles, the Insights index and the shipping tools page.

Articles live in content/insights/<slug>.json (bilingual). Run:

    python3 scripts/build_pages.py

Outputs insights/index.html, insights/<slug>.html, tools/shipping.html and refreshes sitemap.xml.
"""
import html
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://innotronia.com"
PUBLISHED = "2026-09-26"

# display order + accent colour per category
ORDER = ["choose-ecommerce-agency", "us-market-entry-checklist", "cut-us-shipping-costs", "tiktok-shop-creator-sampling"]
CAT_COLOR = {"Choosing an agency": "#8b6cff", "Going global": "#2ee6d6", "Shipping & logistics": "#ffa24a", "TikTok Shop": "#ff3d8b"}


def esc(s):
    return html.escape(s, quote=True)


def bi(en, zh):
    """Inline bilingual text (page.js shows the right one)."""
    return f'<span data-l="en">{en}</span><span data-l="zh" hidden>{zh}</span>'


def head(title_en, title_zh, desc_en, desc_zh, path, extra=""):
    url = SITE + path
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{esc(title_en)}</title>
  <meta name="title-en" content="{esc(title_en)}" />
  <meta name="title-zh" content="{esc(title_zh)}" />
  <meta name="description" content="{esc(desc_en)}" />
  <meta name="desc-en" content="{esc(desc_en)}" />
  <meta name="desc-zh" content="{esc(desc_zh)}" />
  <meta name="theme-color" content="#06060c" />
  <link rel="canonical" href="{url}" />
  <meta property="og:type" content="{'article' if '/insights/' in path and not path.endswith('/') else 'website'}" />
  <meta property="og:site_name" content="Atronia Innovations" />
  <meta property="og:url" content="{url}" />
  <meta property="og:title" content="{esc(title_en)}" />
  <meta property="og:description" content="{esc(desc_en)}" />
  <meta property="og:image" content="{SITE}/assets/img/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicon-32.png" />
  <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png" />
  <link rel="preload" href="/assets/fonts/inter-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="/assets/css/style.css" />
{extra}</head>
<body>
"""


def header(current):
    def link(href, en, zh, key, home=None):
        cur = ' aria-current="page"' if key == current else ""
        dh = f' data-home="{home}"' if home is not None else ""
        return f'<a href="{href}"{dh}{cur}>{bi(en, zh)}</a>'
    return f"""  <header class="sub-nav">
    <div class="container nav__inner">
      <a href="/" data-home class="logo" aria-label="Atronia Innovations home"><img class="logo__img" src="/assets/img/logo-light.png" alt="Atronia Innovations" width="130" height="53" /></a>
      <nav class="sub-nav__links" aria-label="Primary">
        {link('/', 'Home', '首页', 'home', '')}
        {link('/#services', 'Services', '服务内容', 'services', '#services')}
        {link('/insights/', 'Insights', '电商干货', 'insights')}
        {link('/tools/shipping.html', 'Shipping tools', '运费工具', 'tools')}
      </nav>
      <div class="nav__actions" style="display:flex">
        <button class="lang-toggle" type="button" aria-label="Switch language"><span data-lang="en">EN</span><span class="lang-toggle__sep">/</span><span data-lang="zh">中文</span></button>
        <a href="/#contact" data-home="#contact" class="btn btn--grad btn--sm">{bi('Get in touch', '联系我们')}</a>
      </div>
    </div>
  </header>
"""


FOOT = f"""  <footer class="sub-foot">
    <div class="container">
      <span>© 2026 Atronia Innovations Inc.</span>
      <span class="sub-foot__links">
        <a href="/" data-home>{bi('Home', '首页')}</a>
        <a href="/insights/">{bi('Insights', '电商干货')}</a>
        <a href="/tools/shipping.html">{bi('Shipping tools', '运费工具')}</a>
        <a href="/privacy.html">{bi('Privacy Policy', '隐私政策')}</a>
      </span>
    </div>
  </footer>
  <script src="/assets/js/page.js" defer></script>
"""


def load_articles():
    arts = {}
    for p in (ROOT / "content" / "insights").glob("*.json"):
        a = json.loads(p.read_text(encoding="utf-8"))
        arts[a["slug"]] = a
    order = [s for s in ORDER if s in arts] + sorted(s for s in arts if s not in ORDER)
    return [arts[s] for s in order]


def build_article(a, all_articles):
    slug = a["slug"]
    color = CAT_COLOR.get(a["category_en"], "#8b6cff")
    path = f"/insights/{slug}.html"
    ld = {
        "@context": "https://schema.org", "@type": "Article",
        "headline": a["title_en"], "alternativeHeadline": a["title_zh"], "description": a["desc_en"],
        "inLanguage": ["en", "zh"], "datePublished": PUBLISHED, "dateModified": PUBLISHED,
        "keywords": ", ".join(a.get("keywords_en", []) + a.get("keywords_zh", [])),
        "mainEntityOfPage": SITE + path, "image": SITE + "/assets/img/og-image.png",
        "author": {"@type": "Organization", "name": "Atronia Innovations"},
        "publisher": {"@type": "Organization", "name": "Atronia Innovations", "logo": {"@type": "ImageObject", "url": SITE + "/assets/img/logo.png"}},
    }
    extra = f'  <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>\n'
    others = [o for o in all_articles if o["slug"] != slug][:3]

    def one(lang):
        t, cat, body = a[f"title_{lang}"], a[f"category_{lang}"], a[f"body_{lang}"]
        mins = a["read_min"]
        meta = f"Atronia Innovations · {PUBLISHED} · {mins} min read" if lang == "en" else f"Atronia Innovations · {PUBLISHED} · 约 {mins} 分钟阅读"
        rel_h = "Keep reading" if lang == "en" else "继续阅读"
        rel = "\n".join(
            f'        <a href="/insights/{o["slug"]}.html"><small>{esc(o[f"category_{lang}"])}</small>{esc(o[f"title_{lang}"])}</a>' for o in others)
        cta = ({"h": "Want a second pair of eyes on your store or shipping costs?",
                "p": "Tell us where you sell and what you ship. We'll reply within one business day with practical next steps.",
                "b1": "Get in touch", "b2": "Try the shipping tools"} if lang == "en" else
               {"h": "想让我们帮您看看店铺或运费？",
                "p": "告诉我们您在哪些平台销售、运送什么产品，我们会在一个工作日内给出具体可行的建议。",
                "b1": "联系我们", "b2": "试试运费工具"})
        hidden = "" if lang == "en" else " hidden"
        crumbs = "Insights" if lang == "en" else "电商干货"
        return f"""    <article data-l="{lang}"{hidden}>
      <nav class="crumbs"><a href="/insights/">{crumbs}</a> / {esc(cat)}</nav>
      <span class="ins-card__cat" style="--c:{color}">{esc(cat)}</span>
      <h1>{esc(t)}</h1>
      <p class="article__meta">{meta}</p>
      <div class="prose">
{body}
      </div>
      <aside class="article__cta">
        <h2>{cta['h']}</h2>
        <p>{cta['p']}</p>
        <div class="btns"><a href="/#contact" data-home="#contact" class="btn btn--grad">{cta['b1']}</a><a href="/tools/shipping.html" class="btn btn--ghost">{cta['b2']}</a></div>
      </aside>
      <section class="related">
        <h2>{rel_h}</h2>
        <div class="related__list">
{rel}
        </div>
      </section>
    </article>"""

    page = (head(f'{a["title_en"]} | Atronia Innovations', f'{a["title_zh"]} | Atronia Innovations',
                 a["desc_en"], a["desc_zh"], path, extra)
            + header("insights")
            + '  <main class="article">\n' + one("en") + "\n" + one("zh") + "\n  </main>\n" + FOOT + "</body>\n</html>\n")
    (ROOT / "insights" / f"{slug}.html").write_text(page, encoding="utf-8")


def build_index(all_articles):
    path = "/insights/"

    def cards(lang):
        out = []
        for a in all_articles:
            color = CAT_COLOR.get(a["category_en"], "#8b6cff")
            read = f'{a["read_min"]} min read' if lang == "en" else f'约 {a["read_min"]} 分钟'
            more = "Read →" if lang == "en" else "阅读 →"
            out.append(f"""      <a class="ins-card" style="--c:{color}" href="/insights/{a['slug']}.html">
        <span class="ins-card__cat">{esc(a[f'category_{lang}'])}</span>
        <h2>{esc(a[f'title_{lang}'])}</h2>
        <p>{esc(a[f'desc_{lang}'])}</p>
        <span class="ins-card__meta"><span>{read}</span><span>{more}</span></span>
      </a>""")
        return "\n".join(out)

    body = f"""  <div class="aurora" aria-hidden="true" style="position:fixed"><span class="aurora__b aurora__b--1"></span><span class="aurora__b aurora__b--2"></span></div>
  <main class="container">
    <section class="ins-hero">
      <p class="eyebrow"><span class="dot"></span>{bi('Insights', '电商干货')}</p>
      <h1>{bi('Practical guides for <em>marketplace sellers.</em>', '写给跨境卖家的<em>实战干货。</em>')}</h1>
      <p>{bi('Straight answers on agencies, US market entry, shipping costs and TikTok Shop — from a team that runs stores every day.',
             '关于选择代运营、进入美国市场、降低运费和 TikTok Shop 的实用指南，来自每天都在一线运营店铺的团队。')}</p>
    </section>
    <div class="ins-grid" data-l="en">
{cards('en')}
    </div>
    <div class="ins-grid" data-l="zh" hidden>
{cards('zh')}
    </div>
  </main>
"""
    page = (head("Insights — E-commerce guides | Atronia Innovations", "电商干货 — 跨境卖家实战指南 | Atronia Innovations",
                 "Practical guides for marketplace sellers: choosing an e-commerce agency, US market entry, cutting shipping costs and TikTok Shop creator sampling.",
                 "写给跨境卖家的实战指南：如何选择代运营公司、出海美国准备清单、美国小包运费优化、TikTok Shop 达人寄样。", path)
            + header("insights") + body + FOOT + "</body>\n</html>\n")
    (ROOT / "insights" / "index.html").write_text(page, encoding="utf-8")


def build_tools():
    path = "/tools/shipping.html"
    ld = {"@context": "https://schema.org", "@type": "WebApplication", "name": "Shipping cost tools — dimensional weight calculator & savings estimator",
          "url": SITE + path, "applicationCategory": "BusinessApplication", "operatingSystem": "Any",
          "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}, "publisher": {"@type": "Organization", "name": "Atronia Innovations"}}
    extra = f'  <script type="application/ld+json">{json.dumps(ld)}</script>\n'
    body = f"""  <div class="aurora" aria-hidden="true" style="position:fixed"><span class="aurora__b aurora__b--1"></span><span class="aurora__b aurora__b--3"></span></div>
  <main class="container">
    <section class="ins-hero">
      <p class="eyebrow"><span class="dot"></span>{bi('Free shipping tools', '免费运费工具')}</p>
      <h1>{bi('Know your <em>real</em> shipping cost.', '算清您的<em>真实</em>运费。')}</h1>
      <p>{bi('Check the billable (dimensional) weight of a parcel and estimate what better carrier rates could save you each month.',
             '计算包裹的计费重量（体积重），并估算更优的物流协议价每月能为您省下多少运费。')}</p>
    </section>

    <div class="tools">
      <section class="tool" id="dimTool">
        <h2>{bi('Dimensional weight calculator', '体积重计算器')}</h2>
        <p>{bi('Carriers charge the greater of actual weight and dimensional weight. Enter your box size to see the billable weight.',
               '物流商按实际重量与体积重中较大的一个计费。输入箱子尺寸，查看计费重量。')}</p>
        <div class="seg" role="radiogroup" aria-label="Units">
          <label><input type="radio" name="dimUnit" value="imperial" checked /><span>in / lb</span></label>
          <label><input type="radio" name="dimUnit" value="metric" /><span>cm / kg</span></label>
        </div>
        <div class="tool__grid tool__grid--3">
          <label class="in"><span>{bi('Length', '长')} (<i class="u-len">in</i>)</span><input type="number" id="dL" min="0" step="0.1" value="16" inputmode="decimal" /></label>
          <label class="in"><span>{bi('Width', '宽')} (<i class="u-len">in</i>)</span><input type="number" id="dW" min="0" step="0.1" value="12" inputmode="decimal" /></label>
          <label class="in"><span>{bi('Height', '高')} (<i class="u-len">in</i>)</span><input type="number" id="dH" min="0" step="0.1" value="8" inputmode="decimal" /></label>
        </div>
        <div class="tool__grid" style="margin-top:12px">
          <label class="in"><span>{bi('Actual weight', '实际重量')} (<i class="u-wt">lb</i>)</span><input type="number" id="dWt" min="0" step="0.1" value="6" inputmode="decimal" /></label>
          <label class="in"><span>{bi('DIM divisor', '体积重系数')}</span>
            <select id="dDiv">
              <option value="139">139 — {bi('common for UPS / FedEx', 'UPS / FedEx 常用')}</option>
              <option value="166">166 — {bi('USPS (packages over 1 cu ft)', 'USPS（超过 1 立方英尺的包裹）')}</option>
              <option value="custom">{bi('Custom…', '自定义…')}</option>
            </select>
          </label>
          <label class="in" id="dDivCustomWrap" hidden><span>{bi('Custom divisor', '自定义系数')}</span><input type="number" id="dDivCustom" min="1" step="1" value="139" /></label>
        </div>
        <div class="tool__out">
          <div class="tool__stat"><small>{bi('Volume', '体积')}</small><strong id="oVol">—</strong></div>
          <div class="tool__stat"><small>{bi('Dimensional weight', '体积重')}</small><strong id="oDim">—</strong></div>
          <div class="tool__stat tool__stat--hl"><small>{bi('Billable weight', '计费重量')}</small><strong id="oBill">—</strong></div>
        </div>
        <p class="tool__note" id="oNote"></p>
        <p class="tool__note">{bi('Formula: length × width × height (inches) ÷ divisor, rounded up to the next pound. Divisors, rounding and when DIM pricing applies vary by carrier, service and contract — always check your carrier’s current rules.',
                                  '公式：长 × 宽 × 高（英寸）÷ 系数，向上取整到下一磅。不同物流商、服务与协议的系数、取整规则及体积重适用条件各不相同，请以物流商最新规则为准。')}</p>
      </section>

      <section class="tool" id="saveTool">
        <h2>{bi('Shipping savings estimator', '运费节省估算器')}</h2>
        <p>{bi('See what a lower average cost per parcel adds up to over a month and a year.',
               '看看每票平均运费降低一点，一个月、一年累计能省多少。')}</p>
        <div class="tool__grid">
          <label class="in"><span>{bi('Parcels per month', '每月发货件数')}</span><input type="number" id="sQty" min="0" step="100" value="15000" inputmode="numeric" /></label>
          <label class="in"><span>{bi('Current avg. cost per parcel ($)', '目前平均每票运费（美元）')}</span><input type="number" id="sCost" min="0" step="0.1" value="8.5" inputmode="decimal" /></label>
        </div>
        <div style="margin-top:16px">
          <div class="tool__range-row"><span>{bi('Assumed saving per parcel', '假设每票节省比例')}</span><output id="sPctOut">15%</output></div>
          <input type="range" id="sPct" min="5" max="40" step="1" value="15" />
        </div>
        <div class="tool__out">
          <div class="tool__stat"><small>{bi('New avg. cost', '优化后每票')}</small><strong id="oNew">—</strong></div>
          <div class="tool__stat"><small>{bi('Monthly saving', '每月节省')}</small><strong id="oMonth">—</strong></div>
          <div class="tool__stat tool__stat--hl"><small>{bi('Annual saving', '每年节省')}</small><strong id="oYear">—</strong></div>
        </div>
        <p class="tool__note">{bi('Illustrative only. Your actual rates depend on weights, dimensions, zones, service level and volume. Get a real quote for your shipping profile — it’s free.',
                                  '仅为示意估算。实际运费取决于重量、尺寸、区域、服务类型与货量。免费获取基于您真实发货数据的报价。')}</p>
        <div class="tool__cta">
          <a href="/#contact" data-home="#contact" class="btn btn--grad">{bi('Get my real rates', '获取我的真实报价')}</a>
          <a href="/insights/cut-us-shipping-costs.html" class="btn btn--ghost">{bi('7 ways to cut shipping costs', '省运费的 7 个方法')}</a>
        </div>
      </section>
    </div>
  </main>
"""
    page = (head("Free Shipping Tools — DIM Weight Calculator & Savings Estimator | Atronia Innovations",
                 "免费运费工具 — 体积重计算器与运费节省估算 | Atronia Innovations",
                 "Free dimensional weight calculator (in/lb or cm/kg) and shipping savings estimator for US e-commerce parcels. See your billable weight and potential savings.",
                 "免费体积重计算器（支持英寸/磅与厘米/公斤）和运费节省估算器，快速算出美国电商包裹的计费重量与可节省的运费。", path, extra)
            + header("tools") + body + FOOT.replace('<script src="/assets/js/page.js" defer></script>',
                                                   '<script src="/assets/js/page.js" defer></script>\n  <script src="/assets/js/tools.js" defer></script>')
            + "</body>\n</html>\n")
    (ROOT / "tools" / "shipping.html").write_text(page, encoding="utf-8")


def build_sitemap(all_articles):
    alt = lambda u: (f'    <xhtml:link rel="alternate" hreflang="en" href="{u}" />\n'
                     f'    <xhtml:link rel="alternate" hreflang="zh" href="{u}?lang=zh" />\n'
                     f'    <xhtml:link rel="alternate" hreflang="x-default" href="{u}" />\n')
    urls = [(SITE + "/", "1.0", "monthly"), (SITE + "/insights/", "0.8", "weekly"),
            (SITE + "/tools/shipping.html", "0.8", "monthly")]
    urls += [(f"{SITE}/insights/{a['slug']}.html", "0.7", "monthly") for a in all_articles]
    body = "".join(f"  <url>\n    <loc>{u}</loc>\n{alt(u)}    <lastmod>{PUBLISHED}</lastmod>\n    <changefreq>{f}</changefreq>\n    <priority>{p}</priority>\n  </url>\n"
                   for u, p, f in urls)
    body += f"  <url>\n    <loc>{SITE}/privacy.html</loc>\n    <lastmod>{PUBLISHED}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.3</priority>\n  </url>\n"
    (ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
                                      + body + "</urlset>\n", encoding="utf-8")


if __name__ == "__main__":
    (ROOT / "insights").mkdir(exist_ok=True)
    (ROOT / "tools").mkdir(exist_ok=True)
    articles = load_articles()
    for art in articles:
        build_article(art, articles)
    build_index(articles)
    build_tools()
    build_sitemap(articles)
    print(f"built {len(articles)} articles, index, tools page, sitemap")
