import logging
from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest

from app.services import price_service
from app.services.price_service import _ddg_search


@pytest.mark.asyncio
async def test_ddg_search_returns_parsed_results():
    client = MagicMock()
    client.get = AsyncMock(
        return_value=httpx.Response(
            200,
            text="""
                <div class="result">
                    <a class="result__a"
                       href="https://example.com/product"> Product One </a>
                </div>
                <div class="result">
                    <a class="result__a"
                       href="https://example.org/item">Product Two</a>
                </div>
            """,
            request=httpx.Request("GET", "https://example.com"),
        )
    )

    results = await _ddg_search(client, "test product")

    assert len(results) == 2
    assert results[0].title == "Product One"
    assert results[0].url == "https://example.com/product"
    assert results[1].title == "Product Two"
    assert results[1].url == "https://example.org/item"


@pytest.mark.asyncio
async def test_ddg_search_sends_encoded_query_headers_and_timeout():
    client = MagicMock()
    client.get = AsyncMock(
        return_value=httpx.Response(
            200,
            text="",
            request=httpx.Request("GET", "https://example.com"),
        )
    )

    await _ddg_search(client, "laptop & mouse")

    client.get.assert_awaited_once_with(
        "https://html.duckduckgo.com/html/?q=laptop+%26+mouse",
        headers=price_service._HEADERS,
        timeout=8.0,
    )


@pytest.mark.asyncio
async def test_ddg_search_respects_max_results():
    client = MagicMock()
    client.get = AsyncMock(
        return_value=httpx.Response(
            200,
            text="""
                <a class="result__a" href="https://example.com/1">One</a>
                <a class="result__a" href="https://example.com/2">Two</a>
                <a class="result__a" href="https://example.com/3">Three</a>
            """,
            request=httpx.Request("GET", "https://example.com"),
        )
    )

    results = await _ddg_search(client, "query", max_results=2)

    assert [result.title for result in results] == ["One", "Two"]


@pytest.mark.asyncio
async def test_ddg_search_returns_empty_list_when_max_results_is_zero():
    client = MagicMock()
    client.get = AsyncMock(
        return_value=httpx.Response(
            200,
            text='<a class="result__a" href="https://example.com">Example</a>',
            request=httpx.Request("GET", "https://example.com"),
        )
    )

    results = await _ddg_search(client, "query", max_results=0)

    assert results == []
    client.get.assert_awaited_once()


@pytest.mark.asyncio
async def test_ddg_search_skips_results_without_url_or_title():
    client = MagicMock()
    client.get = AsyncMock(
        return_value=httpx.Response(
            200,
            text="""
                <a class="result__a" href="">Missing URL</a>
                <a class="result__a" href="https://example.com/empty"></a>
                <a class="result__a" href="https://example.com/valid">Valid</a>
            """,
            request=httpx.Request("GET", "https://example.com"),
        )
    )

    results = await _ddg_search(client, "query")

    assert len(results) == 1
    assert results[0].title == "Valid"
    assert results[0].url == "https://example.com/valid"


@pytest.mark.asyncio
async def test_ddg_search_extracts_redirect_destination():
    client = MagicMock()
    client.get = AsyncMock(
        return_value=httpx.Response(
            200,
            text="""
                <a class="result__a"
                   href="https://duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fitem">
                   Redirected product
                </a>
            """,
            request=httpx.Request("GET", "https://example.com"),
        )
    )

    results = await _ddg_search(client, "query")

    assert len(results) == 1
    assert results[0].url == "https://example.com/item"


@pytest.mark.asyncio
async def test_ddg_search_logs_exception_and_returns_empty_list(caplog):
    client = MagicMock()
    client.get = AsyncMock(side_effect=httpx.ConnectError("connection failed"))

    with caplog.at_level(logging.ERROR, logger=price_service.__name__):
        results = await _ddg_search(client, "broken query")

    assert results == []
    assert any(
        record.name == price_service.__name__
        and record.levelno == logging.ERROR
        and record.getMessage() == "DDG search failed for query: broken query"
        and record.exc_info is not None
        for record in caplog.records
    )


@pytest.mark.asyncio
async def test_ddg_search_returns_empty_list_when_html_parsing_fails(monkeypatch):
    client = MagicMock()
    client.get = AsyncMock(
        return_value=httpx.Response(
            200,
            text="irrelevant",
            request=httpx.Request("GET", "https://example.com"),
        )
    )

    def raise_parser_error(*args, **kwargs):
        raise ValueError("parser failed")

    monkeypatch.setattr(price_service, "BeautifulSoup", raise_parser_error)

    results = await _ddg_search(client, "query")

    assert results == []
