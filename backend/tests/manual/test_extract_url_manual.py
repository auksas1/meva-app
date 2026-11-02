import json
from types import SimpleNamespace

import pytest
import app.services.price_service as price_service
from app.services.price_service import _extract_url


# Tuščia eilutė tenkina sąlygą „not href“.
def test_extract_url_empty_string_returns_none():
    # Arrange
    href = ""

    # Act
    result = _extract_url(href)

    # Assert
    assert result is None


# None taip pat tenkina sąlygą „not href“.
def test_extract_url_none_returns_none():
    # Arrange
    href = None

    # Act
    result = _extract_url(href)

    # Assert
    assert result is None


# URL be „//“ prefikso lieka nepakeistas, kai neturi uddg parametro.
def test_extract_url_regular_url_without_uddg_returns_original():
    # Arrange
    href = "https://example.com/path"

    # Act
    result = _extract_url(href)

    # Assert
    assert result == href


# „//“ prefiksas pakeičiamas į HTTPS.
def test_extract_url_protocol_relative_url_adds_https():
    # Arrange
    href = "//example.com/path"

    # Act
    result = _extract_url(href)

    # Assert
    assert result == "https://example.com/path"


# Uddg parametro reikšmė dekoduojama ir grąžinama.
def test_extract_url_encoded_uddg_returns_decoded_url():
    # Arrange
    href = "https://search.example/?uddg=https%3A%2F%2Ftarget.example%2Fa%3Fx%3D1"

    # Act
    result = _extract_url(href)

    # Assert
    assert result == "https://target.example/a?x=1"


# Kai uddg parametro nėra, grąžinamas pradinis URL.
def test_extract_url_missing_uddg_returns_original():
    # Arrange
    href = "https://example.com/?other=value"

    # Act
    result = _extract_url(href)

    # Assert
    assert result == href


# Tuščia uddg parametro reikšmė laikoma neteisinga ir grąžinamas pradinis URL.
def test_extract_url_empty_uddg_returns_original(monkeypatch):
    # Arrange
    href = "https://example.com/?uddg="
    monkeypatch.setattr(price_service, "parse_qs", lambda query: {"uddg": [""]})

    # Act
    result = _extract_url(href)

    # Assert
    assert result == href


# Klaida URL analizės metu pagaunama, todėl grąžinamas pradinis URL.
def test_extract_url_urlparse_error_returns_original(monkeypatch):
    # Arrange
    href = "https://example.com/path"

    def raise_error(value):
        raise ValueError("invalid URL")

    monkeypatch.setattr(price_service, "urlparse", raise_error)

    # Act
    result = _extract_url(href)

    # Assert
    assert result == href


@pytest.mark.xfail(strict=True, reason="parse_qs jau dekoduoja, unquote dekoduoja antrą kartą")
def test_extract_url_encoded_percent_is_preserved():
    href = "https://duckduckgo.com/l/?uddg=https%3A%2F%2Fa.example%2Fx%2520y"
    assert _extract_url(href) == "https://a.example/x%20y"