
from django.db import IntegrityError, transaction
from django.db.models import ProtectedError
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import SearchFilter
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import BasePermission
from rest_framework.response import Response


from .importers import clean_date, pick, read_rows, split_name, text
from .models import (
    BaptismRecord,
    CommunionRecord,
    ConfirmationRecord,
    Document,
    MatrimonyRecord,
    Parish,
)
from .serializers import (
    BaptismSerializer,
    CommunionSerializer,
    ConfirmationSerializer,
    DocumentSerializer,
    MatrimonySerializer,
    ParishSerializer,
)


# ---------------------------------------------------------------
# Permission helpers
# ---------------------------------------------------------------

def is_central_admin(user):
    return user.is_authenticated and user.is_superuser


def get_staff_parish(user):
    if is_central_admin(user):
        return None

    try:
        profile = user.staff_profile
    except Exception:
        raise PermissionDenied("Your staff parish profile was not found.")

    if not profile.is_active:
        raise PermissionDenied("Your staff account is inactive.")

    return profile.parish


class ParishAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return request.user and request.user.is_authenticated

        return is_central_admin(request.user)


# ---------------------------------------------------------------
# Import helpers
# ---------------------------------------------------------------

class RowError(Exception):
    """A row that cannot be imported."""


class Ctx:
    def __init__(self, default_parish, staff_parish=None):
        self.default = default_parish
        self.staff_parish = staff_parish
        self.parishes = {
            p.name.lower(): p for p in Parish.objects.all()
        }
        self._keys = {}

    def parish_by_name(self, name):
        return self.parishes.get(name.strip().lower()) if name else None

    def parish_for(self, row):
        # Staff imports always belong to their assigned parish.
        # They cannot choose another parish in the import file.
        if self.staff_parish:
            return self.staff_parish

        name = text(pick(row, "parish", "parishname"))

        if name:
            parish = self.parish_by_name(name)
            if not parish:
                raise RowError(
                    f"parish “{name}” not found (add it in the admin first)"
                )
            return parish

        if self.default:
            return self.default

        raise RowError(
            "no parish: choose one above or add a Parish column"
        )

    def claim(self, model, parish, number):
        if not number:
            return True

        if model not in self._keys:
            self._keys[model] = {
                (p, n.lower())
                for p, n in model.objects.exclude(
                    registration_number=""
                ).values_list("parish_id", "registration_number")
            }

        key = (parish.id, number.lower())

        if key in self._keys[model]:
            return False

        self._keys[model].add(key)
        return True

    def find_baptism(self, row):
        # Baptism lookup is intentionally across all parishes.
        qs = BaptismRecord.objects.all()

        number = text(pick(
            row,
            "baptismnumber",
            "baptismno",
            "baptismregistrationnumber",
            "baptismreg",
        ))

        if number:
            qs = qs.filter(registration_number__iexact=number)

            baptism_parish = text(pick(row, "baptismparish"))
            if baptism_parish:
                qs = qs.filter(
                    parish__name__iexact=baptism_parish
                )
        else:
            try:
                christian_name, surname = split_name(row)
            except ValueError:
                raise RowError(
                    "no baptism number or name to find the person"
                )

            qs = qs.filter(
                christian_name__iexact=christian_name,
                surname__iexact=surname,
            )

        found = list(qs[:2])

        if not found:
            raise RowError(
                "no matching baptism record (add the baptism first)"
            )

        if len(found) > 1:
            raise RowError(
                "more than one baptism matches: add a Baptism number column"
            )

        return found[0]


def import_rows(request, model, build):
    uploaded_file = request.FILES.get("file")

    if not uploaded_file:
        return Response(
            {"detail": "Choose a file to import."},
            status=400,
        )

    try:
        rows = read_rows(uploaded_file)
    except ValueError as error:
        return Response({"detail": str(error)}, status=400)
    except Exception:
        return Response(
            {
                "detail": (
                    "This file could not be opened. Check that it is "
                    "a valid Excel or Access file."
                )
            },
            status=400,
        )

    if is_central_admin(request.user):
        default_parish = Parish.objects.filter(
            pk=request.data.get("default_parish") or None
        ).first()
        staff_parish = None
    else:
        staff_parish = get_staff_parish(request.user)
        default_parish = staff_parish

    ctx = Ctx(
        default_parish=default_parish,
        staff_parish=staff_parish,
    )

    objects = []
    problems = []

    for row_number, row in enumerate(rows, start=2):
        try:
            objects.append(build(row, ctx))
        except RowError as error:
            problems.append(f"Row {row_number}: {error}")

    try:
        with transaction.atomic():
            model.objects.bulk_create(objects)
    except IntegrityError:
        return Response(
            {"detail": "A registration number in the file already exists."},
            status=400,
        )

    return Response(
        {
            "imported": len(objects),
            "skipped": len(problems),
            "problems": problems[:15],
        },
        status=201,
    )


def build_baptism(row, ctx):
    parish = ctx.parish_for(row)

    number = text(pick(
        row,
        "registrationnumber",
        "baptismnumber",
        "regno",
        "number",
        "no",
    ))

    if not number:
        raise RowError("no registration number")

    try:
        christian_name, surname = split_name(row)
    except ValueError as error:
        raise RowError(str(error))

    date_of_baptism = clean_date(
        pick(row, "dateofbaptism", "baptismdate", "date")
    )

    if not date_of_baptism:
        raise RowError("no date of baptism")

    if not ctx.claim(BaptismRecord, parish, number):
        raise RowError(
            f"baptism number {number} already exists in {parish.name}"
        )

    home_parish = (
        ctx.parish_by_name(text(pick(row, "homeparish"))) or parish
    )

    return BaptismRecord(
        registration_number=number,
        parish=parish,
        home_parish=home_parish,
        christian_name=christian_name,
        surname=surname,
        date_of_baptism=date_of_baptism,
        date_of_birth=clean_date(
            pick(row, "dob", "dateofbirth", "birthdate", "birth")
        ),
        phone_number=text(
            pick(row, "phone", "phonenumber", "telephone")
        ),
        father_name=text(pick(row, "father", "fathername")),
        mother_name=text(pick(row, "mother", "mothername")),
        godparent_name=text(
            pick(row, "godparent", "godparentname", "sponsor")
        ),
        residence=text(pick(row, "residence", "address", "village")),
        minister=text(pick(row, "minister", "priest")),
        notes=text(pick(row, "notes", "remarks")),
    )


def _sacrament_builder(model):
    def build(row, ctx):
        parish = ctx.parish_for(row)
        baptism = ctx.find_baptism(row)

        received = clean_date(
            pick(
                row,
                "datereceived",
                "date",
                "dateofcommunion",
                "dateofconfirmation",
            )
        )

        if not received:
            raise RowError("no date")

        number = text(
            pick(row, "registrationnumber", "regno", "number")
        )

        if not ctx.claim(model, parish, number):
            raise RowError(
                f"registration number {number} already exists in {parish.name}"
            )

        return model(
            baptism=baptism,
            parish=parish,
            date_received=received,
            registration_number=number,
            minister=text(pick(row, "minister", "priest")),
        )

    return build


def build_matrimony(row, ctx):
    parish = ctx.parish_for(row)
    baptism = ctx.find_baptism(row)

    spouse = text(pick(row, "spousename", "spouse", "partner"))

    if not spouse:
        raise RowError("no spouse name")

    married = clean_date(
        pick(row, "dateofmarriage", "marriagedate", "date")
    )

    if not married:
        raise RowError("no date of marriage")

    number = text(
        pick(
            row,
            "registrationnumber",
            "marriagenumber",
            "regno",
            "number",
        )
    )

    if not ctx.claim(MatrimonyRecord, parish, number):
        raise RowError(
            f"registration number {number} already exists in {parish.name}"
        )

    return MatrimonyRecord(
        baptism=baptism,
        parish=parish,
        spouse_name=spouse,
        date_of_marriage=married,
        registration_number=number,
        spouse_baptism_parish=ctx.parish_by_name(
            text(pick(row, "spousebaptismparish"))
        ),
        spouse_baptism_registration_number=text(
            pick(
                row,
                "spousebaptismnumber",
                "spousebaptismregistrationnumber",
            )
        ),
        notes=text(pick(row, "notes", "remarks")),
    )


# ---------------------------------------------------------------
# Shared view mixins
# ---------------------------------------------------------------

class ImportMixin:
    builder = None

    @action(
        detail=False,
        methods=["post"],
        url_path="import",
        parser_classes=[MultiPartParser, FormParser],
    )
    def import_file(self, request):
        return import_rows(
            request,
            self.queryset.model,
            self.builder,
        )


class ProtectedDeleteMixin:
    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {
                    "detail": (
                        "Other records use this one (for example sacraments). "
                        "Remove those first."
                    )
                },
                status=409,
            )


class StaffParishRecordsMixin:
    """
    Staff can manage only records belonging to their assigned parish.
    Central administrators can manage records across all parishes.
    """

    def get_queryset(self):
        queryset = super().get_queryset()

        if is_central_admin(self.request.user):
            return queryset

        parish = get_staff_parish(self.request.user)
        return queryset.filter(parish=parish)

    def perform_create(self, serializer):
        if is_central_admin(self.request.user):
            serializer.save()
        else:
            parish = get_staff_parish(self.request.user)
            serializer.save(parish=parish)


# ---------------------------------------------------------------
# Parish view
# ---------------------------------------------------------------

class ParishViewSet(viewsets.ModelViewSet):
    queryset = Parish.objects.all()
    serializer_class = ParishSerializer
    permission_classes = [ParishAdminOrReadOnly]


# ---------------------------------------------------------------
# Baptism view
# ---------------------------------------------------------------

class BaptismViewSet(
    ImportMixin,
    ProtectedDeleteMixin,
    viewsets.ModelViewSet,
):
    # Staff can search and view baptisms from every parish.
    queryset = BaptismRecord.objects.select_related(
        "parish",
        "home_parish",
    )
    serializer_class = BaptismSerializer
    builder = staticmethod(build_baptism)

    filter_backends = [SearchFilter]
    search_fields = [
        "christian_name",
        "surname",
        "registration_number",
    ]

    def perform_create(self, serializer):
        if is_central_admin(self.request.user):
            serializer.save()
        else:
            parish = get_staff_parish(self.request.user)
            serializer.save(parish=parish)

    def perform_update(self, serializer):
        instance = self.get_object()

        if not is_central_admin(self.request.user):
            parish = get_staff_parish(self.request.user)

            if instance.parish_id != parish.id:
                raise PermissionDenied(
                    "You can only edit baptism records belonging to your parish."
                )

            serializer.save(parish=parish)
        else:
            serializer.save()

    def perform_destroy(self, instance):
        if not is_central_admin(self.request.user):
            parish = get_staff_parish(self.request.user)

            if instance.parish_id != parish.id:
                raise PermissionDenied(
                    "You cannot delete a baptism record belonging to another parish."
                )

        instance.delete()


# ---------------------------------------------------------------
# Communion, Confirmation and Matrimony
# ---------------------------------------------------------------

_PERSON_SEARCH = [
    "baptism__christian_name",
    "baptism__surname",
    "baptism__registration_number",
    "registration_number",
]


class CommunionViewSet(
    ImportMixin,
    StaffParishRecordsMixin,
    viewsets.ModelViewSet,
):
    queryset = CommunionRecord.objects.select_related(
        "baptism",
        "parish",
        "baptism__parish",
    )
    serializer_class = CommunionSerializer
    builder = staticmethod(_sacrament_builder(CommunionRecord))
    filter_backends = [SearchFilter]
    search_fields = _PERSON_SEARCH


class ConfirmationViewSet(
    ImportMixin,
    StaffParishRecordsMixin,
    viewsets.ModelViewSet,
):
    queryset = ConfirmationRecord.objects.select_related(
        "baptism",
        "parish",
        "baptism__parish",
    )
    serializer_class = ConfirmationSerializer
    builder = staticmethod(_sacrament_builder(ConfirmationRecord))
    filter_backends = [SearchFilter]
    search_fields = _PERSON_SEARCH


class MatrimonyViewSet(
    ImportMixin,
    StaffParishRecordsMixin,
    viewsets.ModelViewSet,
):
    queryset = MatrimonyRecord.objects.select_related(
        "baptism",
        "parish",
        "baptism__parish",
        "spouse_baptism",
        "spouse_baptism_parish",
    )
    serializer_class = MatrimonySerializer
    builder = staticmethod(build_matrimony)
    filter_backends = [SearchFilter]
    search_fields = _PERSON_SEARCH + ["spouse_name"]


# ---------------------------------------------------------------
# Documents
# ---------------------------------------------------------------

class DocumentViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Document.objects.select_related(
        "baptism",
        "parish",
    )
    serializer_class = DocumentSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = super().get_queryset()

        if is_central_admin(self.request.user):
            return queryset

        parish = get_staff_parish(self.request.user)
        return queryset.filter(parish=parish)

    def perform_create(self, serializer):
        uploaded_file = self.request.FILES.get("file")

        if not uploaded_file:
            raise PermissionDenied("Choose a document file.")

        save_data = {
            "original_name": uploaded_file.name,
            "size": uploaded_file.size,
        }

        if not is_central_admin(self.request.user):
            save_data["parish"] = get_staff_parish(self.request.user)
        else:
            parish_id = self.request.data.get("parish")

            if parish_id:
                try:
                    save_data["parish"] = Parish.objects.get(
                        pk=parish_id
                    )
                except Parish.DoesNotExist:
                    raise PermissionDenied(
                        "The selected parish was not found."
                    )

        serializer.save(**save_data)

    def perform_destroy(self, instance):
        instance.file.delete(save=False)
        instance.delete()
