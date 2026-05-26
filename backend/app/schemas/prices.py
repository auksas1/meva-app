from pydantic import BaseModel


class PriceSearchRequest(BaseModel):
    part_names: list[str]
    car_query: str


class SearchResult(BaseModel):
    title: str
    url: str


class PartSearchResult(BaseModel):
    part_name_en: str
    part_name_lt: str
    results: list[SearchResult]


class PriceSearchResponse(BaseModel):
    results: list[PartSearchResult]
