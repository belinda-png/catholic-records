from rest_framework.routers import DefaultRouter

from .views import (
    ParishViewSet,
    BaptismViewSet,
    CommunionViewSet,
    ConfirmationViewSet,
    MatrimonyViewSet,
    DocumentViewSet,
)

router = DefaultRouter()
router.register("parishes", ParishViewSet, basename="parish")
router.register("baptisms", BaptismViewSet, basename="baptism")
router.register("communions", CommunionViewSet, basename="communion")
router.register("confirmations", ConfirmationViewSet, basename="confirmation")
router.register("matrimonies", MatrimonyViewSet, basename="matrimony")
router.register("documents", DocumentViewSet, basename="document")

urlpatterns = router.urls