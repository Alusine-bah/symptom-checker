"""Verify every source link the app relies on.

Run from the project folder:

    python backend/verify_sources.py                 # is every link alive, and is it about the right disease?
    python backend/verify_sources.py --content       # also check the page supports our cause/prevention wording
    python backend/verify_sources.py --only malaria,cholera
    python backend/verify_sources.py --open-blocked  # open pages the script cannot read, to check by eye

Every run prints a summary and saves docs/source-report.csv.
The exit code is 1 if any link is broken or could not be reached.

Result meanings
  OK          page loads and mentions the disease
  REDIRECTED  page loads but the address has moved: update the link to the final address
  REVIEW      page loads but does not obviously mention the disease: open it and check
  BLOCKED     the site refuses scripts (for example CDC): open it in a browser and check by eye
  BROKEN      page not found, a "not found" page, or it sends you to the home page
  ERROR       network problem or server error: run again; if it persists, treat as broken
"""
import argparse
import csv
import glob
import html as htmllib
import json
import os
import re
import sys
import time
import unicodedata
import webbrowser
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "data")
REPORT = os.path.join(HERE, "..", "docs", "source-report.csv")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

SOFT_404 = (
    "page not found",
    "404 error",
    "error 404",
    "page cannot be found",
    "page could not be found",
    "we can't find",
    "we cant find",
    "this page doesn't exist",
    "the page you requested",
    "the page you are looking for",
)

NAME_STOP = {"disease", "infection", "syndrome", "acute", "chronic", "with", "from", "and", "the", "type"}
WORD_STOP = set(
    """about after again also another because before being between could during either every other
    often other should since still their there these those through under until using where which while without would
    people person being become causes caused cause usually sometimes spread spreads spreading
    bacteria bacterial viral virus infection infections infected disease diseases health worker workers
    seek care early treatment treated treat avoid keep stay make sure make""".split()
)


# ---------------------------------------------------------------- loading
def load_diseases():
    out = []
    for path in sorted(glob.glob(os.path.join(DATA, "diseases_*.json"))):
        with open(path, encoding="utf-8") as f:
            out.extend(json.load(f))
    return out


# ---------------------------------------------------------------- fetching
def fetch(url, tries=4, timeout=30, max_bytes=800_000):
    """Return (status, final_url, body_text, error). Retries on timeouts and 5xx."""
    last_err = None
    for attempt in range(tries):
        try:
            req = Request(url, headers=HEADERS)
            with urlopen(req, timeout=timeout) as resp:
                raw = resp.read(max_bytes)
                charset = resp.headers.get_content_charset() or "utf-8"
                return resp.status, resp.geturl(), raw.decode(charset, errors="replace"), None
        except HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and attempt < tries - 1:
                time.sleep(2 * (attempt + 1))
                continue
            return e.code, url, "", None
        except Exception as e:  # timeouts, SSL handshakes, DNS
            last_err = f"{type(e).__name__}: {e}"
            time.sleep(3 * (attempt + 1))
    return None, url, "", last_err


# ---------------------------------------------------------------- text helpers
def fold(s):
    """Lower-case and strip accents so 'diarrhée' matches 'diarrhee'."""
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    # British and American spellings: diarrhoea/diarrhea, haemorrhagic/hemorrhagic, oedema/edema
    return s.replace("oe", "e").replace("ae", "e")


def page_title(body):
    m = re.search(r"<title[^>]*>(.*?)</title>", body, re.S | re.I)
    return re.sub(r"\s+", " ", htmllib.unescape(m.group(1))).strip() if m else ""


def visible_text(body):
    body = re.sub(r"(?is)<(script|style|noscript)[^>]*>.*?</\1>", " ", body)
    body = re.sub(r"(?s)<[^>]+>", " ", body)
    return fold(re.sub(r"\s+", " ", htmllib.unescape(body)))


def name_tokens(name):
    words = re.findall(r"[a-zA-Z]{4,}", fold(name))
    return [w for w in dict.fromkeys(words) if w not in NAME_STOP]


def norm_url(u):
    p = urlparse(u)
    host = p.netloc.lower().removeprefix("www.")
    return host + p.path.rstrip("/").lower()


def support(text_value, page_text):
    """Share of the meaningful words in our wording that also appear on the page."""
    words = [w for w in dict.fromkeys(re.findall(r"[a-zA-Z]{6,}", fold(text_value))) if w not in WORD_STOP]
    if not words:
        return 1.0, []
    missing = []
    for w in words:
        forms = {w}
        for suffix in ("ing", "ed", "es", "s"):
            if w.endswith(suffix) and len(w) - len(suffix) >= 5:
                forms.add(w[: -len(suffix)])
        if not any(f in page_text for f in forms):
            missing.append(w)
    return 1 - len(missing) / len(words), missing


# ---------------------------------------------------------------- one disease
def check_one(d, content=False):
    url = d["source_url"]
    status, final, body, err = fetch(url)
    row = {
        "slug": d["slug"], "url": url, "status": status if status is not None else "", "final_url": final,
        "result": "", "note": "", "title": "", "cause_support": "", "prevention_support": "",
        "description_support": "", "missing_terms": "", "checked_on": date.today().isoformat(),
    }

    if status is None:
        row.update(result="ERROR", note=err or "could not connect")
        return row
    if status in (404, 410):
        row.update(result="BROKEN", note=f"HTTP {status}: page not found")
        return row
    if status in (401, 403, 429, 451, 999):
        row.update(result="BLOCKED", note=f"HTTP {status}: site refuses scripts, check in a browser")
        return row
    if status >= 500:
        row.update(result="ERROR", note=f"HTTP {status}: server error")
        return row
    if status != 200:
        row.update(result="BROKEN", note=f"HTTP {status}")
        return row

    title = page_title(body)
    text = visible_text(body)
    row["title"] = title

    head = fold(title) + " " + text[:1500]
    if any(p in fold(title) or p in text[:1500] for p in SOFT_404):
        row.update(result="BROKEN", note="loads, but looks like a 'page not found' page")
        return row

    a, b = urlparse(url), urlparse(final)
    if norm_url(url) != norm_url(final):
        if b.path.strip("/") == "" and a.path.strip("/") != "":
            row.update(result="BROKEN", note=f"redirects to the home page: {final}")
            return row
        row["note"] = f"moved to {final}"
        row["result"] = "REDIRECTED"

    tokens = name_tokens(d["en"]["name"])
    searchable = fold(title) + " " + text[:8000]
    if tokens and not any(t in searchable for t in tokens):
        row["result"] = "REVIEW"
        row["note"] = (row["note"] + "; " if row["note"] else "") + "page does not mention " + ", ".join(tokens[:4])

    if content:
        miss = []
        for field, key in (("cause", "cause_support"), ("prevention", "prevention_support"), ("description", "description_support")):
            share, missing = support(d["en"][field], text)
            row[key] = f"{share:.0%}"
            miss.extend(f"{field}:{w}" for w in missing[:6])
            # Only cause and prevention are judged. The description is paraphrased, so it is just reported.
            if field != "description" and share < 0.35 and row["result"] in ("", "OK"):
                row["result"] = "REVIEW"
                row["note"] = (row["note"] + "; " if row["note"] else "") + f"{field} wording poorly supported by the page ({share:.0%})"
        row["missing_terms"] = " ".join(miss)

    if not row["result"]:
        row["result"] = "OK"
    return row


# ---------------------------------------------------------------- report merging
def merge_rows(existing, new, order):
    """Replace the rows of re-checked diseases in an existing report, keeping the rest."""
    by_slug = {r["slug"]: r for r in existing}
    for r in new:
        by_slug[r["slug"]] = r
    ordered = [by_slug[s] for s in order if s in by_slug]
    ordered += [r for s, r in by_slug.items() if s not in order]
    return ordered


# ---------------------------------------------------------------- main
def main(argv=None):
    ap = argparse.ArgumentParser(description="Verify the app's source links.")
    ap.add_argument("--content", action="store_true", help="also check that the page supports our wording")
    ap.add_argument("--only", default="", help="comma-separated disease slugs to check")
    ap.add_argument("--open-blocked", action="store_true", help="open BLOCKED pages in your browser")
    ap.add_argument("--workers", type=int, default=3, help="parallel requests (lower is gentler)")
    args = ap.parse_args(argv)

    diseases = load_diseases()
    if args.only:
        wanted = {s.strip() for s in args.only.split(",") if s.strip()}
        diseases = [d for d in diseases if d["slug"] in wanted]
        if not diseases:
            sys.exit("No disease matches --only")

    print(f"Checking {len(diseases)} links{' and page content' if args.content else ''} ...")
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        rows = list(pool.map(lambda d: check_one(d, content=args.content), diseases))

    counts = {}
    for r in rows:
        counts[r["result"]] = counts.get(r["result"], 0) + 1

    for r in rows:
        if r["result"] != "OK":
            print(f"[{r['result']}] {r['slug']}: {r['url']}\n         {r['note']}")
    print("\nSummary:", ", ".join(f"{k} {v}" for k, v in sorted(counts.items())))

    os.makedirs(os.path.dirname(REPORT), exist_ok=True)
    all_rows = rows
    if args.only and os.path.exists(REPORT):
        with open(REPORT, newline="", encoding="utf-8") as f:
            all_rows = merge_rows(list(csv.DictReader(f)), rows, [d["slug"] for d in load_diseases()])
    with open(REPORT, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(all_rows)
    print("Report saved to", os.path.normpath(REPORT))
    if all_rows is not rows:
        total = {}
        for r in all_rows:
            total[r["result"]] = total.get(r["result"], 0) + 1
        print("Whole report now:", ", ".join(f"{k} {v}" for k, v in sorted(total.items())))

    blocked = [r for r in rows if r["result"] == "BLOCKED"]
    if blocked and args.open_blocked:
        print(f"\nOpening {len(blocked)} pages in your browser. Check each shows the right disease.")
        for r in blocked:
            webbrowser.open(r["url"])
            time.sleep(1.2)
    elif blocked:
        print(f"\n{len(blocked)} link(s) are BLOCKED for scripts. Run with --open-blocked to check them by eye.")

    bad = counts.get("BROKEN", 0) + counts.get("ERROR", 0)
    if bad:
        print(f"\n{bad} link(s) need fixing.")
    else:
        print("\nNo broken links.")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
