from .companies import router as companies_router
from .parts import router as parts_router
from .complaints import router as complaints_router
from .analytics import router as analytics_router

__all__ = ["companies_router", "parts_router", "complaints_router", "analytics_router"]