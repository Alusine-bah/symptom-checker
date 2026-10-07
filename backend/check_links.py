import glob
import json
import os
import urllib.request
import urllib.error

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
HEADERS = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"}

def check(url):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception as e:
        return f"ERROR: {e}"

def main():
    bad = 0
    total = 0
    for path in sorted(glob.glob(os.path.join(DATA, "diseases_*.json"))):
        with open(path, encoding="utf-8") as f:
            for d in json.load(f):
                total += 1
                status = check(d["source_url"])
                if status != 200:
                    bad += 1
                    print(f"[{status}] {d['slug']}: {d['source_url']}")
    print(f"Checked {total} links, {bad} need attention")

if __name__ == "__main__":
    main()