from fastapi import APIRouter

from app.schemas.prices import PriceSearchRequest, PriceSearchResponse
from app.services.price_service import search_price_links

router = APIRouter(prefix="/prices", tags=["prices"])


@router.post("/search-links", response_model=PriceSearchResponse)
async def search_price_links_endpoint(body: PriceSearchRequest) -> PriceSearchResponse:
    return await search_price_links(body.part_names, body.car_query)
