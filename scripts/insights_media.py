#!/usr/bin/env python3
"""Generate on-brand SVG visuals for Insights articles.

- cover_svg(article, lang)  -> 1200x630 cover (used by build_pages.py)
- chart CLI:  python3 scripts/insights_media.py chart path/to/spec.json
  Writes assets/insights/<slug>/<name>-en.svg and -zh.svg and prints the
  <figure> HTML to paste into body_en / body_zh.

Chart spec (JSON):
{
  "slug": "article-slug", "name": "fee-change",
  "type": "bar" | "hbar" | "line",
  "title_en": "...", "title_zh": "...",
  "labels_en": ["Q1", "Q2"], "labels_zh": ["一季度", "二季度"],
  "series": [{"name_en": "2025", "name_zh": "2025 年", "values": [1.2, 3.4]}],   # 1–3 series
  "unit": "$" | "%" | "" ,  "unit_position": "prefix" | "suffix",  "decimals": 1,
  "source_en": "Source: Amazon Seller Central announcement, Sept 2026",
  "source_zh": "来源：Amazon 卖家平台公告，2026 年 9 月",
  "caption_en": "...", "caption_zh": "..."          # optional, shown under the figure
}
Only chart numbers that come from a cited source.
"""
import html
import json
import math
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONT = "Inter, -apple-system, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif"
SERIES_COLORS = ["#ff3d8b", "#8b6cff", "#2ee6d6"]


def esc(s):
    return html.escape(str(s), quote=True)


def text_width(s, size):
    """Rough rendered width: CJK ≈ 1em, latin ≈ 0.55em."""
    w = 0.0
    for ch in s:
        w += 1.0 if ord(ch) > 0x2E80 else (0.32 if ch in "il.,:;'| " else 0.56)
    return w * size


def wrap(s, size, max_w, max_lines):
    """Greedy wrap that works for both spaced English and unspaced Chinese."""
    tokens, cur = [], ""
    for ch in s:
        if ord(ch) > 0x2E80:
            if cur:
                tokens.append(cur); cur = ""
            if ch in "，。、；：！？）》」』%" and tokens:
                tokens[-1] += ch  # never start a line with closing punctuation
            else:
                tokens.append(ch)
        elif ch == " ":
            cur += ch; tokens.append(cur); cur = ""
        else:
            cur += ch
    if cur:
        tokens.append(cur)
    lines, line = [], ""
    for t in tokens:
        if text_width((line + t).rstrip(), size) > max_w and line:
            lines.append(line.rstrip()); line = t.lstrip()
        else:
            line += t
    if line:
        lines.append(line.rstrip())
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        while text_width(lines[-1] + "…", size) > max_w and lines[-1]:
            lines[-1] = lines[-1][:-1]
        lines[-1] = lines[-1].rstrip() + "…"
    return lines


# ---------------------------------------------------------------- covers
def cover_svg(a, lang, color):
    title = a[f"title_{lang}"]
    cat = a[f"category_{lang}"]
    size = 64 if lang == "en" else 60
    lines = wrap(title, size, 1030, 3)
    y0 = 300 - (len(lines) - 1) * size * 0.62
    title_svg = "".join(
        f'<text x="80" y="{y0 + i * size * 1.22:.0f}" font-size="{size}" font-weight="700" fill="#f4f2fb" letter-spacing="-0.5">{esc(l)}</text>'
        for i, l in enumerate(lines))
    label = cat.upper() if lang == "en" else cat
    # uppercase glyphs are ~0.7em wide, plus the letter-spacing on every character
    chip_w = (len(label) * (20 * 0.7 + 2) if lang == "en" else text_width(label, 20) + len(label)) + 48
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="{FONT}">
  <defs>
    <radialGradient id="g1" cx="85%" cy="10%" r="75%"><stop offset="0" stop-color="{color}" stop-opacity=".55"/><stop offset="1" stop-color="{color}" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="0%" cy="100%" r="70%"><stop offset="0" stop-color="#8b6cff" stop-opacity=".35"/><stop offset="1" stop-color="#8b6cff" stop-opacity="0"/></radialGradient>
    <linearGradient id="bar" x1="0" x2="1"><stop offset="0" stop-color="#8b6cff"/><stop offset=".55" stop-color="#ff3d8b"/><stop offset="1" stop-color="#ffa24a"/></linearGradient>
    <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="#ffffff" fill-opacity=".07"/></pattern>
  </defs>
  <rect width="1200" height="630" fill="#08080f"/>
  <rect width="1200" height="630" fill="url(#g1)"/>
  <rect width="1200" height="630" fill="url(#g2)"/>
  <rect width="1200" height="630" fill="url(#dots)"/>
  <rect x="80" y="84" width="{chip_w:.0f}" height="42" rx="21" fill="{color}" fill-opacity=".16" stroke="{color}" stroke-opacity=".6"/>
  <text x="{80 + chip_w / 2:.0f}" y="112" font-size="20" font-weight="700" fill="{color}" text-anchor="middle" letter-spacing="{2 if lang == 'en' else 1}">{esc(cat.upper() if lang == 'en' else cat)}</text>
  {title_svg}
  <rect x="80" y="520" width="120" height="5" rx="2.5" fill="url(#bar)"/>
  <text x="80" y="566" font-size="24" font-weight="700" fill="#f4f2fb">Atronia <tspan fill="#ff5fa2">Innovations</tspan></text>
  <text x="1120" y="566" font-size="22" fill="#a3a1b8" text-anchor="end">innotronia.com · {esc(a['date'])}</text>
</svg>
"""


# ---------------------------------------------------------------- charts
def fmt(v, spec):
    d = spec.get("decimals", 0)
    s = f"{v:,.{d}f}"
    u = spec.get("unit", "")
    return (u + s) if spec.get("unit_position", "prefix") == "prefix" else (s + u)


def nice_max(v):
    if v <= 0:
        return 1
    e = 10 ** math.floor(math.log10(v))
    for m in (1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10):
        if m * e >= v:
            return m * e
    return 10 * e


def chart_svg(spec, lang):
    W = 640  # narrow canvas so text stays legible when scaled down on phones
    kind = spec.get("type", "bar")
    labels = spec[f"labels_{lang}"]
    series = spec["series"]
    title = spec[f"title_{lang}"]
    source = spec[f"source_{lang}"]
    t_lines = wrap(title, 28, W - 64, 3)
    top = 40 + len(t_lines) * 36
    legend = len(series) > 1
    if legend:
        top += 30
    vmax = nice_max(max(max(s["values"]) for s in series))
    parts = [f'<rect width="{W}" height="__H__" rx="22" fill="#0e0e1a"/>',
             f'<rect x="0.5" y="0.5" width="{W - 1}" height="__H1__" rx="22" fill="none" stroke="#ffffff" stroke-opacity=".1"/>']
    for i, l in enumerate(t_lines):
        parts.append(f'<text x="32" y="{58 + i * 36}" font-size="28" font-weight="700" fill="#f4f2fb">{esc(l)}</text>')
    if legend:
        lx = 32
        for si, s in enumerate(series):
            name = s[f"name_{lang}"]
            parts.append(f'<rect x="{lx}" y="{top - 22}" width="14" height="14" rx="3" fill="{SERIES_COLORS[si]}"/>'
                         f'<text x="{lx + 22}" y="{top - 10}" font-size="17" fill="#a3a1b8">{esc(name)}</text>')
            lx += 22 + text_width(name, 17) + 24

    if kind == "hbar":
        row = 46
        label_w = min(240, max(text_width(l, 18) for l in labels) + 16)
        x0, x1 = 32 + label_w, W - 96
        y = top + 18
        for i, lab in enumerate(labels):
            parts.append(f'<text x="{x0 - 14}" y="{y + (30 * len(series) - 6) / 2 + 6:.0f}" font-size="18" fill="#d9d6e6" text-anchor="end">{esc(lab)}</text>')
            for si, s in enumerate(series):
                v = s["values"][i]
                w = max(2, (x1 - x0) * v / vmax)
                yy = y + si * 30
                parts.append(f'<rect x="{x0}" y="{yy}" width="{w:.1f}" height="24" rx="6" fill="{SERIES_COLORS[si]}"/>'
                             f'<text x="{x0 + w + 10:.1f}" y="{yy + 18}" font-size="18" font-weight="600" fill="#f4f2fb">{esc(fmt(v, spec))}</text>')
            y += 30 * len(series) + 22
        bottom = y + 4
    else:
        ch = 280
        x0, x1 = 76, W - 28
        y0, y1 = top + 20, top + 20 + ch
        for k in range(5):
            gy = y1 - ch * k / 4
            parts.append(f'<line x1="{x0}" x2="{x1}" y1="{gy:.1f}" y2="{gy:.1f}" stroke="#ffffff" stroke-opacity="{.16 if k == 0 else .07}"/>'
                         f'<text x="{x0 - 12}" y="{gy + 5:.1f}" font-size="16" fill="#6f6d85" text-anchor="end">{esc(fmt(vmax * k / 4, spec))}</text>')
        n = len(labels)
        slot = (x1 - x0) / n
        if kind == "line":
            for si, s in enumerate(series):
                pts = [(x0 + slot * (i + .5), y1 - ch * v / vmax) for i, v in enumerate(s["values"])]
                parts.append(f'<polyline points="{" ".join(f"{px:.1f},{py:.1f}" for px, py in pts)}" fill="none" stroke="{SERIES_COLORS[si]}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>')
                for (px, py), v in zip(pts, s["values"]):
                    parts.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="5.5" fill="#0e0e1a" stroke="{SERIES_COLORS[si]}" stroke-width="3"/>'
                                 f'<text x="{px:.1f}" y="{py - 14:.1f}" font-size="16" font-weight="600" fill="#f4f2fb" text-anchor="middle">{esc(fmt(v, spec))}</text>')
        else:
            bw = min(64, slot * .7 / len(series))
            for i in range(n):
                for si, s in enumerate(series):
                    v = s["values"][i]
                    h = ch * v / vmax
                    bx = x0 + slot * i + (slot - bw * len(series)) / 2 + si * bw
                    parts.append(f'<rect x="{bx:.1f}" y="{y1 - h:.1f}" width="{bw - 4:.1f}" height="{max(h, 1):.1f}" rx="6" fill="{SERIES_COLORS[si]}"/>'
                                 f'<text x="{bx + (bw - 4) / 2:.1f}" y="{y1 - h - 9:.1f}" font-size="{16 if len(series) == 1 else 13}" font-weight="600" fill="#f4f2fb" text-anchor="middle">{esc(fmt(v, spec))}</text>')
        for i, lab in enumerate(labels):
            lines = wrap(lab, 16, slot - 4, 2)
            for j, l in enumerate(lines):
                parts.append(f'<text x="{x0 + slot * (i + .5):.1f}" y="{y1 + 26 + j * 19}" font-size="16" fill="#a3a1b8" text-anchor="middle">{esc(l)}</text>')
        bottom = y1 + 60
    s_lines = wrap(source, 15, W - 64, 3)
    for j, l in enumerate(s_lines):
        parts.append(f'<text x="32" y="{bottom + 10 + j * 20}" font-size="15" fill="#6f6d85">{esc(l)}</text>')
    H = int(bottom + 30 + (len(s_lines) - 1) * 20)
    body = "\n  ".join(parts).replace("__H__", str(H)).replace("__H1__", str(H - 1))
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="{FONT}">\n  {body}\n</svg>\n'


def make_chart(spec_path):
    spec = json.loads(pathlib.Path(spec_path).read_text(encoding="utf-8"))
    out = ROOT / "assets" / "insights" / spec["slug"]
    out.mkdir(parents=True, exist_ok=True)
    snippets = {}
    for lang in ("en", "zh"):
        name = f'{spec["name"]}-{lang}.svg'
        (out / name).write_text(chart_svg(spec, lang), encoding="utf-8")
        cap = spec.get(f"caption_{lang}") or spec[f"title_{lang}"]
        snippets[lang] = (f'<figure><img src="/assets/insights/{spec["slug"]}/{name}" alt="{esc(spec[f"title_{lang}"])}" '
                          f'loading="lazy" width="640" /><figcaption>{esc(cap)}</figcaption></figure>')
    print(json.dumps(snippets, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "chart":
        make_chart(sys.argv[2])
    else:
        print(__doc__)
