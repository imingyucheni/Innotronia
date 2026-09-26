#!/usr/bin/env python3
"""Validate Insights articles before publishing.

  python3 scripts/check_insights.py            # check every article
  python3 scripts/check_insights.py slug-a slug-b   # check only these (stricter rules apply to them)

Exits non-zero on any error. Run after scripts/build_pages.py.
"""
import json
import pathlib
import re
import sys
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent
ALLOWED = {"h2", "h3", "p", "ul", "ol", "li", "strong", "em", "a", "blockquote", "table", "thead", "tbody",
           "tr", "th", "td", "figure", "img", "figcaption", "br"}
KEYS = ["slug", "date", "title_en", "title_zh", "desc_en", "desc_zh", "category_en", "category_zh",
        "read_min", "keywords_en", "keywords_zh", "body_en", "body_zh"]
NEWS_CATS = {"Industry news"}


class Scan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.imgs, self.links, self.bad = [], [], [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        self.tags.append(tag)
        if tag not in ALLOWED:
            self.bad.append(f"<{tag}> not allowed")
        if "style" in a or any(k.startswith("on") for k in a):
            self.bad.append(f"<{tag}> has style/on* attribute")
        if tag == "img":
            self.imgs.append(a)
        if tag == "a":
            self.links.append(a)


def check(a, strict):
    errs, slug = [], a.get("slug", "?")
    for k in KEYS:
        if k not in a:
            errs.append(f"missing key {k}")
    if errs:
        return errs
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", slug):
        errs.append("slug must be lowercase-hyphenated")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", a["date"]):
        errs.append("date must be YYYY-MM-DD")
    for lang in ("en", "zh"):
        body = a[f"body_{lang}"]
        s = Scan()
        s.feed(body)
        errs += [f"{lang}: {b}" for b in s.bad]
        if re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", body):
            errs.append(f"{lang}: contains an email address")
        for img in s.imgs:
            src = img.get("src", "")
            if not src.startswith(f"/assets/insights/{slug}/"):
                errs.append(f"{lang}: img src must be under /assets/insights/{slug}/ ({src})")
            elif not (ROOT / src.lstrip("/")).is_file():
                errs.append(f"{lang}: img file missing {src}")
            if not img.get("alt"):
                errs.append(f"{lang}: img without alt ({src})")
        for l in s.links:
            href = l.get("href", "")
            if href.startswith("/"):
                path = href.split("#")[0].split("?")[0]
                if path and path != "/" and not (ROOT / path.lstrip("/")).exists():
                    errs.append(f"{lang}: broken internal link {href}")
            elif href.startswith("http") and "innotronia.com" not in href:
                if "nofollow" not in l.get("rel", "") or l.get("target") != "_blank":
                    errs.append(f"{lang}: external link needs rel=\"nofollow noopener\" target=\"_blank\" ({href})")
        if strict:
            if "figure" not in s.tags and "table" not in s.tags:
                errs.append(f"{lang}: needs at least one chart (<figure>) or <table>")
            external = [l for l in s.links if l.get("href", "").startswith("http") and "innotronia.com" not in l.get("href", "")]
            if len(external) < (3 if a.get("type") == "news" or a["category_en"] in NEWS_CATS else 1):
                errs.append(f"{lang}: too few cited sources ({len(external)})")
            if not re.search(r"<h2>\s*(Sources|信息来源|参考来源|数据来源)", body):
                errs.append(f"{lang}: missing Sources / 信息来源 section")
    page = ROOT / "insights" / f"{slug}.html"
    if not page.is_file():
        errs.append("page not built (run scripts/build_pages.py)")
    for lang in ("en", "zh"):
        if not (ROOT / "assets" / "insights" / slug / f"cover-{lang}.svg").is_file():
            errs.append(f"cover-{lang}.svg missing (run scripts/build_pages.py)")
    if f"/insights/{slug}.html" not in (ROOT / "sitemap.xml").read_text(encoding="utf-8"):
        errs.append("not in sitemap.xml")
    return errs


def main(argv):
    only = set(argv)
    bad = 0
    for p in sorted((ROOT / "content" / "insights").glob("*.json")):
        try:
            a = json.loads(p.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            print(f"✗ {p.name}: invalid JSON: {e}")
            bad += 1
            continue
        if only and a.get("slug") not in only:
            continue
        errs = check(a, strict=bool(only))
        if errs:
            bad += 1
            print(f"✗ {a.get('slug', p.name)}")
            for e in errs:
                print(f"    - {e}")
        else:
            print(f"✓ {a['slug']}")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main(sys.argv[1:])
