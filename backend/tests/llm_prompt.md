## Užduotis

Tu esi Python testuotojas. Parašyk pytest vienetų testus dviem FastAPI projekto funkcijoms:

1. `_ddg_search` iš modulio `app.services.price_service`;
2. `current_user` iš modulio `app.auth`.

Funkcijų kodas:

```python
# app/services/price_service.py
import logging
from typing import Optional
from urllib.parse import parse_qs, quote_plus, unquote, urlparse

import httpx
from bs4 import BeautifulSoup

from app.schemas.prices import SearchResult  # pydantic: title: str, url: str

logger = logging.getLogger(__name__)

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
```

```python
# app/auth.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db  # Base (SQLAlchemy DeclarativeBase) taip pat yra app.database
from app.models.user import AuthSession, User

bearer_scheme = HTTPBearer(auto_error=False)


def current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if creds is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = db.get(AuthSession, creds.credentials)
    user = db.get(User, session.user_id) if session else None
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if user.is_blocked:
        raise HTTPException(status_code=403, detail="Account blocked")
    return user
```

Modeliai `app/models/user.py`:

- `User`: lentelė `users`; laukai `id` (int, PK), `email` (str, unique, privalomas), `password_hash` (str, privalomas), `name` (str | None), `role` (str, numatyta "user"), `is_blocked` (bool, numatyta False), `created_at`.
- `AuthSession`: lentelė `sessions`; laukai `token` (str, PK), `user_id` (int, FK į `users.id`), `created_at`.

## Taisyklės

1. Naudok `pytest` ir `pytest-asyncio` (`@pytest.mark.asyncio` async testams). Kitų bibliotekų nediegti.
2. Testai negali kreiptis į tikrą internetą ar tikrą duomenų bazę.
3. Testai turi padengti visus sakinius ir visas `if` / `for` šakas abiejose funkcijose.
4. Vienas testas tikrina vieną elgseną. Testo pavadinimas pasako, ką jis tikrina.
5. Tikrink ne tik grąžinamą reikšmę, bet ir šalutinius efektus (pvz., ką funkcija siunčia ar įrašo į log).
6. Nekeisk tiriamų funkcijų kodo.

## Išvesties formatas

Grąžink tik du Python failus, kiekvieną atskirame kodo bloke:

1. `tests/test_ddg_search_llm.py`
2. `tests/test_current_user_llm.py`

Failai turi veikti paleidus `pytest tests/` iš projekto `backend/` katalogo. Jokio paaiškinimo už kodo blokų ribų.
