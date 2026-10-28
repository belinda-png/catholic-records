
from django.urls import path

from .views import (
    ParishListView,
    parish_statistics,
    PersonSearchView,
    person_sacramental_history,
)

urlpatterns = [
    path("parishes/", ParishListView.as_view(), name="parish-list"),
    path(
        "parishes/<int:parish_id>/statistics/",
        parish_statistics,
        name="parish-statistics",
    ),
    path("people/search/", PersonSearchView.as_view(), name="person-search"),
    path(
        "people/<int:person_id>/history/",
        person_sacramental_history,
        name="person-sacramental-history",
    ),
]
