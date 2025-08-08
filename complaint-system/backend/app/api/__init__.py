from .companies import router as companies_router
from .parts import router as parts_router
from .complaints import router as complaints_router
from .analytics import router as analytics_router
from .follow_up_actions import router as follow_up_actions_router
from .responsibles import router as responsibles_router

__all__ = [
    "companies_router", 
    "parts_router", 
    "complaints_router", 
    "analytics_router",
    "follow_up_actions_router",
    "responsibles_router"
]