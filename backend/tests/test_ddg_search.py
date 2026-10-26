"""Basis path tests for _ddg_search (CC 6)."""
import httpx
import pytest

from app.services.price_service import _HEADERS, _ddg_search

DDG_HREF = "//duckduckgo.com/l/?uddg=https%3A%2F%2Fshop.lt%2F{n}&rut=x"


def _result(n: int, title: str = "Part") -> str:
    return f'<a class="result__a" href="{DDG_HREF.format(n=n)}">{title} {n}</a>'


def _client(html: str = "", error: Exception | None = None, requests: list | None = None) -> httpx.AsyncClient:
    def handler(request: httpx.Request) -> httpx.Response:
        if requests is not None:
            requests.append(request)
        if error:
            raise error
        return httpx.Response(200, text=html)

    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


@pytest.mark.asyncio
async def test_returns_results_with_decoded_uddg_url():
    async with _client(_result(1) + _result(2)) as client:
        results = await _ddg_search(client, "bamperis")

    assert [(r.title, r.url) for r in results] == [
        ("Part 1", "https://shop.lt/1"),
        ("Part 2", "https://shop.lt/2"),
    ]


@pytest.mark.asyncio
async def test_sends_browser_headers_and_timeout():
    requests = []
    async with _client(requests=requests) as client:
        await _ddg_search(client, "bamperis")

    assert requests[0].headers["User-Agent"] == _HEADERS["User-Agent"]
    assert requests[0].extensions["timeout"]["read"] == 8.0


@pytest.mark.asyncio
async def test_stops_at_default_max_results():
    async with _client("".join(_result(n) for n in range(5))) as client:
        results = await _ddg_search(client, "bamperis")

    assert [r.url for r in results] == [f"https://shop.lt/{n}" for n in range(3)]


@pytest.mark.asyncio
async def test_skips_link_without_href():
    html = '<a class="result__a">No href</a>' + _result(1)
    async with _client(html) as client:
        results = await _ddg_search(client, "bamperis")

    assert [r.title for r in results] == ["Part 1"]


@pytest.mark.asyncio
async def test_skips_link_without_title():
    html = f'<a class="result__a" href="{DDG_HREF.format(n=0)}"> </a>' + _result(1)
    async with _client(html) as client:
        results = await _ddg_search(client, "bamperis")

    assert [r.url for r in results] == ["https://shop.lt/1"]


@pytest.mark.asyncio
async def test_returns_empty_list_when_page_has_no_results():
    async with _client("<html><body>No results</body></html>") as client:
        assert await _ddg_search(client, "bamperis") == []


@pytest.mark.asyncio
async def test_returns_empty_list_and_logs_when_request_fails(caplog):
    async with _client(error=httpx.ConnectError("offline")) as client:
        results = await _ddg_search(client, "bamperis")

    assert results == []
    assert caplog.messages == ["DDG search failed for query: bamperis"]
