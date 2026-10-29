
from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import (
    Parish,
    Person,
    BaptismRecord,
    CommunionRecord,
    ConfirmationRecord,
    MatrimonyRecord,
)

from .serializers import (
    ParishSerializer,
    PersonSerializer,
    BaptismRecordSerializer,
    CommunionRecordSerializer,
    ConfirmationRecordSerializer,
    MatrimonyRecordSerializer,
)


class ParishListView(generics.ListAPIView):
    queryset = Parish.objects.filter(is_active=True)
    serializer_class = ParishSerializer


class PersonSearchView(generics.ListCreateAPIView):
    serializer_class = PersonSerializer

    def get_queryset(self):
        queryset = Person.objects.select_related("home_parish")

        search_term = self.request.query_params.get("q", "").strip()
        parish_id = self.request.query_params.get("parish_id")

        if search_term:
            queryset = queryset.filter(
                Q(christian_name__icontains=search_term)
                | Q(surname__icontains=search_term)
                | Q(registration_number__icontains=search_term)
            )

        if parish_id:
            queryset = queryset.filter(home_parish_id=parish_id)

        return queryset.distinct()


@api_view(["GET"])
def parish_statistics(request, parish_id):
    parish = get_object_or_404(
        Parish,
        id=parish_id,
        is_active=True,
    )

    return Response({
        "parish_id": parish.id,
        "parish_name": parish.name,
        "registered_people": Person.objects.filter(
            home_parish=parish
        ).count(),
        "baptisms": BaptismRecord.objects.filter(
            parish=parish
        ).count(),
        "first_holy_communions": CommunionRecord.objects.filter(
            parish=parish
        ).count(),
        "confirmations": ConfirmationRecord.objects.filter(
            parish=parish
        ).count(),
        "matrimonies": MatrimonyRecord.objects.filter(
            parish=parish
        ).count(),
    })


class BaptismListCreateView(generics.ListCreateAPIView):
    serializer_class = BaptismRecordSerializer
    queryset = BaptismRecord.objects.select_related(
        "person", "parish"
    ).all()


class BaptismDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BaptismRecordSerializer
    queryset = BaptismRecord.objects.select_related(
        "person", "parish"
    ).all()


class CommunionListCreateView(generics.ListCreateAPIView):
    serializer_class = CommunionRecordSerializer
    queryset = CommunionRecord.objects.select_related(
        "person", "parish"
    ).all()


class CommunionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CommunionRecordSerializer
    queryset = CommunionRecord.objects.select_related(
        "person", "parish"
    ).all()


class ConfirmationListCreateView(generics.ListCreateAPIView):
    serializer_class = ConfirmationRecordSerializer
    queryset = ConfirmationRecord.objects.select_related(
        "person", "parish"
    ).all()


class ConfirmationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ConfirmationRecordSerializer
    queryset = ConfirmationRecord.objects.select_related(
        "person", "parish"
    ).all()


class MatrimonyListCreateView(generics.ListCreateAPIView):
    serializer_class = MatrimonyRecordSerializer
    queryset = MatrimonyRecord.objects.select_related(
        "person", "spouse", "parish", "spouse_baptism_parish"
    ).all()


class MatrimonyDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MatrimonyRecordSerializer
    queryset = MatrimonyRecord.objects.select_related(
        "person", "spouse", "parish", "spouse_baptism_parish"
    ).all()


@api_view(["GET"])
def person_sacramental_history(request, person_id):
    person = get_object_or_404(
        Person.objects.select_related("home_parish"),
        id=person_id,
    )

    return Response({
        "person": PersonSerializer(person).data,
        "baptisms": BaptismRecordSerializer(
            person.baptism_records.select_related("parish").all(),
            many=True,
        ).data,
        "first_holy_communions": CommunionRecordSerializer(
            person.communion_records.select_related("parish").all(),
            many=True,
        ).data,
        "confirmations": ConfirmationRecordSerializer(
            person.confirmation_records.select_related("parish").all(),
            many=True,
        ).data,
        "matrimonies": MatrimonyRecordSerializer(
            person.matrimony_records.select_related(
                "parish", "spouse", "spouse_baptism_parish"
            ).all(),
            many=True,
        ).data,
        "spouse_matrimonies": MatrimonyRecordSerializer(
            person.spouse_matrimony_records.select_related(
                "parish", "spouse", "spouse_baptism_parish"
            ).all(),
            many=True,
        ).data,
    })
