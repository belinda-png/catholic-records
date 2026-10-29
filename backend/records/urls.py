
from django.urls import path

from .views import (
    ParishListView,
    parish_statistics,
    PersonSearchView,
    person_sacramental_history,
    BaptismListCreateView,
    BaptismDetailView,
    CommunionListCreateView,
    CommunionDetailView,
    ConfirmationListCreateView,
    ConfirmationDetailView,
    MatrimonyListCreateView,
    MatrimonyDetailView,
)

urlpatterns = [
    # Existing dashboard endpoints
    path(
        "parishes/",
        ParishListView.as_view(),
        name="parish-list",
    ),
    path(
        "parishes/<int:parish_id>/statistics/",
        parish_statistics,
        name="parish-statistics",
    ),
    path(
        "people/search/",
        PersonSearchView.as_view(),
        name="person-search",
    ),
    path(
        "people/<int:person_id>/history/",
        person_sacramental_history,
        name="person-sacramental-history",
    ),

    # Baptism records
    path(
        "baptisms/",
        BaptismListCreateView.as_view(),
        name="baptism-list-create",
    ),
    path(
        "baptisms/<int:pk>/",
        BaptismDetailView.as_view(),
        name="baptism-detail",
    ),

    # First Holy Communion records
    path(
        "communions/",
        CommunionListCreateView.as_view(),
        name="communion-list-create",
    ),
    path(
        "communions/<int:pk>/",
        CommunionDetailView.as_view(),
        name="communion-detail",
    ),

    # Confirmation records
    path(
        "confirmations/",
        ConfirmationListCreateView.as_view(),
        name="confirmation-list-create",
    ),
    path(
        "confirmations/<int:pk>/",
        ConfirmationDetailView.as_view(),
        name="confirmation-detail",
    ),

    # Matrimony records
    path(
        "matrimonies/",
        MatrimonyListCreateView.as_view(),
        name="matrimony-list-create",
    ),
    path(
        "matrimonies/<int:pk>/",
        MatrimonyDetailView.as_view(),
        name="matrimony-detail",
    ),
]
