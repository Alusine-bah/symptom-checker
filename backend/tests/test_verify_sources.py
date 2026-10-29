"""Offline tests for the link verifier, using a tiny local web server."""
import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

import verify_sources  # noqa: E402
from verify_sources import check_one, merge_rows, support  # noqa: E402

GOOD = """<html><head><title>Malaria - fact sheet</title></head><body>
<h1>Malaria</h1><p>Malaria is caused by Plasmodium parasites spread by Anopheles mosquitoes.
Use insecticide-treated nets to prevent bites.</p></body></html>"""


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def _send(self, code, body="", headers=None):
        self.send_response(code)
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(body.encode())

    def do_GET(self):
        p = self.path
        if p == "/ok":
            self._send(200, GOOD)
        elif p == "/":
            self._send(200, "<html><title>Home</title><body>Welcome</body></html>")
        elif p == "/missing":
            self._send(404, "nope")
        elif p == "/blocked":
            self._send(403, "forbidden")
        elif p == "/error":
            self._send(500, "boom")
        elif p == "/soft":
            self._send(200, "<html><title>Page not found</title><body>Sorry</body></html>")
        elif p == "/to-home":
            self._send(302, "", {"Location": "/"})
        elif p == "/moved":
            self._send(301, "", {"Location": "/ok"})
        elif p == "/british":
            self._send(200, "<html><title>Diarrhoeal disease</title><body>Diarrhoea is caused by many germs</body></html>")
        elif p == "/wrong":
            self._send(200, "<html><title>Football results</title><body>The league table and match scores</body></html>")
        else:
            self._send(404, "nope")


@pytest.fixture(autouse=True)
def no_waiting(monkeypatch):
    """The real tool waits between retries; the tests should not."""
    monkeypatch.setattr(verify_sources.time, "sleep", lambda seconds: None)


@pytest.fixture(scope="module")
def base():
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{server.server_address[1]}"
    server.shutdown()


def disease(url):
    return {
        "slug": "malaria",
        "source_url": url,
        "en": {
            "name": "Malaria",
            "description": "A life-threatening illness spread by mosquito bites.",
            "cause": "Plasmodium parasites, passed on by infected Anopheles mosquitoes.",
            "prevention": "Sleep under insecticide-treated nets.",
        },
    }


def test_good_page_is_ok(base):
    assert check_one(disease(base + "/ok"))["result"] == "OK"


def test_missing_page_is_broken(base):
    assert check_one(disease(base + "/missing"))["result"] == "BROKEN"


def test_forbidden_is_blocked_not_broken(base):
    assert check_one(disease(base + "/blocked"))["result"] == "BLOCKED"


def test_server_error_is_error(base):
    assert check_one(disease(base + "/error"))["result"] == "ERROR"


def test_soft_404_is_broken(base):
    assert check_one(disease(base + "/soft"))["result"] == "BROKEN"


def test_redirect_to_home_is_broken(base):
    assert check_one(disease(base + "/to-home"))["result"] == "BROKEN"


def test_moved_page_is_flagged(base):
    row = check_one(disease(base + "/moved"))
    assert row["result"] == "REDIRECTED"
    assert row["final_url"].endswith("/ok")


def test_page_about_something_else_needs_review(base):
    assert check_one(disease(base + "/wrong"))["result"] == "REVIEW"


def test_unreachable_server_is_error():
    row = check_one(disease("http://127.0.0.1:9/never"))
    assert row["result"] == "ERROR"


def test_content_check_passes_for_supported_wording(base):
    row = check_one(disease(base + "/ok"), content=True)
    assert row["result"] == "OK"
    assert int(row["cause_support"].rstrip("%")) >= 60


def test_content_check_flags_unsupported_wording(base):
    d = disease(base + "/ok")
    d["en"]["cause"] = "Caused by contaminated shellfish and radioactive groundwater."
    row = check_one(d, content=True)
    assert row["result"] == "REVIEW"
    assert "cause" in row["note"]


def test_support_ignores_accents_and_plurals():
    share, missing = support("Parasites and mosquitoes", "parasite mosquito")
    assert share == 1.0 and missing == []


def test_british_and_american_spellings_match(base):
    d = disease(base + "/british")
    d["en"]["name"] = "Diarrheal illness"
    assert check_one(d)["result"] == "OK"


def test_merge_rows_replaces_only_rechecked_diseases():
    old = [{"slug": "a", "result": "ERROR"}, {"slug": "b", "result": "OK"}]
    new = [{"slug": "a", "result": "OK"}]
    merged = merge_rows(old, new, ["a", "b"])
    assert [(r["slug"], r["result"]) for r in merged] == [("a", "OK"), ("b", "OK")]


def test_extra_sources_are_checked_too():
    from verify_sources import expand_sources
    d = {"slug": "x", "source_url": "https://a.example/1",
         "extra_sources": [{"title": "T", "url": "https://b.example/2"}]}
    out = expand_sources([d, {"slug": "y", "source_url": "https://c.example/3"}])
    assert [t["slug"] for t in out] == ["x", "x+src2", "y"]
    assert out[1]["source_url"] == "https://b.example/2"
