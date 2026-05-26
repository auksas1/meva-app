import asyncio
import logging
from typing import Optional
from urllib.parse import parse_qs, quote_plus, unquote, urlparse

import httpx
from bs4 import BeautifulSoup

from app.schemas.prices import PartSearchResult, PriceSearchResponse, SearchResult

logger = logging.getLogger(__name__)

_PART_NAME_LT: dict[str, str] = {
    "Damaged component": "Kėbulo dalis",
    "Body panel": "Kėbulo dalis",
    "Paint surface": "Dažai",
    "Tire / wheel": "Padanga",
    "Bumper cover": "Bamperis",
    "Door panel": "Durų skydas",
    "Windshield": "Priekinis stiklas",
    "Hood": "Dangtis",
    "Fender": "Sparnas",
}

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept-Language": "lt-LT,lt;q=0.9,en;q=0.8",
}


def _extract_url(href: str) -> Optional[str]:
    if not href:
        return None
    if href.startswith("//"):
        href = "https:" + href
    try:
        params = parse_qs(urlparse(href).query)
        uddg = params.get("uddg", [None])[0]
        return unquote(uddg) if uddg else href
    except Exception:
        return href


async def _ddg_search(client: httpx.AsyncClient, query: str, max_results: int = 3) -> list[SearchResult]:
    try:
        url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
        resp = await client.get(url, headers=_HEADERS, timeout=8.0)
        soup = BeautifulSoup(resp.text, "html.parser")
        results: list[SearchResult] = []
        for a in soup.select("a.result__a"):
            if len(results) >= max_results:
                break
            real_url = _extract_url(a.get("href", ""))
            title = a.get_text(strip=True)
            if real_url and title:
                results.append(SearchResult(title=title, url=real_url))
        return results
    except Exception:
        logger.exception("DDG search failed for query: %s", query)
        return []


async def search_price_links(part_names: list[str], car_query: str) -> PriceSearchResponse:
    async with httpx.AsyncClient(follow_redirects=True) as client:
        queries = [
            (name, _PART_NAME_LT.get(name, name))
            for name in part_names
        ]
        tasks = [
            _ddg_search(client, f"{lt} {car_query} kaina")
            for _, lt in queries
        ]
        all_results = await asyncio.gather(*tasks)

    return PriceSearchResponse(results=[
        PartSearchResult(part_name_en=name, part_name_lt=lt, results=res)
        for (name, lt), res in zip(queries, all_results)
    ])
