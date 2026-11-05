from django.db import IntegrityError, transaction
from django.db.models import ProtectedError
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .importers import clean_date, pick, read_rows, split_name, text
from .models import (BaptismRecord, CommunionRecord, ConfirmationRecord, Document,
                     MatrimonyRecord, Parish)
from .serializers import (BaptismSerializer, CommunionSerializer, ConfirmationSerializer,
                          DocumentSerializer, MatrimonySerializer, ParishSerializer)


# ---------------------------------------------------------------- import ---
class RowError(Exception):
    """A row that cannot be imported. The message is shown to the user."""


class Ctx:
    def __init__(self, default_parish):
        self.default = default_parish
        self.parishes = {p.name.lower(): p for p in Parish.objects.all()}
        self._keys = {}

    def parish_by_name(self, name):
        return self.parishes.get(name.strip().lower()) if name else None

    def parish_for(self, row):
        name = text(pick(row, "parish", "parishname"))
        if name:
            p = self.parish_by_name(name)
            if not p:
                raise RowError(f"parish “{name}” not found (add it in the admin first)")
            return p
        if self.default:
            return self.default
        raise RowError("no parish: choose one above or add a Parish column")

    def claim(self, model, parish, number):
        """False if this registration number already exists in this parish."""
        if not number:
            return True
        if model not in self._keys:
            self._keys[model] = {
                (p, n.lower()) for p, n in
                model.objects.exclude(registration_number="").values_list("parish_id", "registration_number")}
        key = (parish.id, number.lower())
        if key in self._keys[model]:
            return False
        self._keys[model].add(key)
        return True

    def find_baptism(self, row):
        """Match the person by baptism number (best) or by christian name + surname."""
        qs = BaptismRecord.objects.all()
        number = text(pick(row, "baptismnumber", "baptismno", "baptismregistrationnumber", "baptismreg"))
        if number:
            qs = qs.filter(registration_number__iexact=number)
            bparish = text(pick(row, "baptismparish"))
            if bparish:
                qs = qs.filter(parish__name__iexact=bparish)
        else:
            try:
                cn, sn = split_name(row)
            except ValueError:
                raise RowError("no baptism number or name to find the person")
            qs = qs.filter(christian_name__iexact=cn, surname__iexact=sn)
        found = list(qs[:2])
        if not found:
            raise RowError("no matching baptism record (add the baptism first)")
        if len(found) > 1:
            raise RowError("more than one baptism matches: add a Baptism number column")
        return found[0]


def import_rows(request, model, build):
    f = request.FILES.get("file")
    if not f:
        return Response({"detail": "Choose a file to import."}, status=400)
    try:
        rows = read_rows(f)
    except ValueError as e:
        return Response({"detail": str(e)}, status=400)
    except Exception:
        return Response({"detail": "This file could not be opened. Check that it is a valid Excel or Access file."},
                        status=400)

    default = Parish.objects.filter(pk=request.data.get("default_parish") or None).first()
    ctx, objs, problems = Ctx(default), [], []
    for n, row in enumerate(rows, start=2):  # row 1 is the heading row
        try:
            objs.append(build(row, ctx))
        except RowError as e:
            problems.append(f"Row {n}: {e}")
    try:
        with transaction.atomic():
            model.objects.bulk_create(objs)  # saved in file order
    except IntegrityError:
        return Response({"detail": "A registration number in the file already exists."}, status=400)
    return Response({"imported": len(objs), "skipped": len(problems), "problems": problems[:15]}, status=201)


def build_baptism(row, ctx):
    parish = ctx.parish_for(row)
    number = text(pick(row, "registrationnumber", "baptismnumber", "regno", "number", "no"))
    if not number:
        raise RowError("no registration number")
    try:
        cn, sn = split_name(row)
    except ValueError as e:
        raise RowError(str(e))
    date_of_baptism = clean_date(pick(row, "dateofbaptism", "baptismdate", "date"))
    if not date_of_baptism:
        raise RowError("no date of baptism")
    if not ctx.claim(BaptismRecord, parish, number):
        raise RowError(f"baptism number {number} already exists in {parish.name}")
    home = ctx.parish_by_name(text(pick(row, "homeparish"))) or parish
    return BaptismRecord(
        registration_number=number, parish=parish, home_parish=home,
        christian_name=cn, surname=sn,
        date_of_baptism=date_of_baptism,
        date_of_birth=clean_date(pick(row, "dob", "dateofbirth", "birthdate", "birth")),
        phone_number=text(pick(row, "phone", "phonenumber", "telephone")),
        father_name=text(pick(row, "father", "fathername")),
        mother_name=text(pick(row, "mother", "mothername")),
        godparent_name=text(pick(row, "godparent", "godparentname", "sponsor")),
        residence=text(pick(row, "residence", "address", "village")),
        date_of_baptism=date_of_baptism,
        minister=text(pick(row, "minister", "priest")),
        notes=text(pick(row, "notes", "remarks")),
    )


def _sacrament_builder(model):
    def build(row, ctx):
        parish = ctx.parish_for(row)
        baptism = ctx.find_baptism(row)
        received = clean_date(pick(row, "datereceived", "date", "dateofcommunion", "dateofconfirmation"))
        if not received:
            raise RowError("no date")
        number = text(pick(row, "registrationnumber", "regno", "number"))
        if not ctx.claim(model, parish, number):
            raise RowError(f"registration number {number} already exists in {parish.name}")
        return model(baptism=baptism, parish=parish, date_received=received, registration_number=number,
                     minister=text(pick(row, "minister", "priest")))
    return build


def build_matrimony(row, ctx):
    parish = ctx.parish_for(row)
    baptism = ctx.find_baptism(row)
    spouse = text(pick(row, "spousename", "spouse", "partner"))
    if not spouse:
        raise RowError("no spouse name")
    married = clean_date(pick(row, "dateofmarriage", "marriagedate", "date"))
    if not married:
        raise RowError("no date of marriage")
    number = text(pick(row, "registrationnumber", "marriagenumber", "regno", "number"))
    if not ctx.claim(MatrimonyRecord, parish, number):
        raise RowError(f"registration number {number} already exists in {parish.name}")
    return MatrimonyRecord(
        baptism=baptism, parish=parish, spouse_name=spouse, date_of_marriage=married,
        registration_number=number,
        spouse_baptism_parish=ctx.parish_by_name(text(pick(row, "spousebaptismparish"))),
        spouse_baptism_registration_number=text(pick(row, "spousebaptismnumber", "spousebaptismregistrationnumber")),
        notes=text(pick(row, "notes", "remarks")),
    )


# ----------------------------------------------------------------- views ---
class ImportMixin:
    builder = None  # set as staticmethod(...) on each view

    @action(detail=False, methods=["post"], url_path="import",
            parser_classes=[MultiPartParser, FormParser])
    def import_file(self, request):
        return import_rows(request, self.queryset.model, self.builder)


class ProtectedDeleteMixin:
    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response({"detail": "Other records use this one (for example sacraments). Remove those first."},
                            status=409)


class ParishViewSet(ProtectedDeleteMixin, viewsets.ModelViewSet):
    queryset = Parish.objects.all()
    serializer_class = ParishSerializer


class BaptismViewSet(ImportMixin, ProtectedDeleteMixin, viewsets.ModelViewSet):
    queryset = BaptismRecord.objects.select_related("parish")
    serializer_class = BaptismSerializer
    builder = staticmethod(build_baptism)
    filter_backends = [SearchFilter]
    search_fields = ["christian_name", "surname", "registration_number"]


_PERSON_SEARCH = ["baptism__christian_name", "baptism__surname", "baptism__registration_number",
                  "registration_number"]


class CommunionViewSet(ImportMixin, viewsets.ModelViewSet):
    queryset = CommunionRecord.objects.select_related("baptism", "parish")
    serializer_class = CommunionSerializer
    builder = staticmethod(_sacrament_builder(CommunionRecord))
    filter_backends = [SearchFilter]
    search_fields = _PERSON_SEARCH


class ConfirmationViewSet(ImportMixin, viewsets.ModelViewSet):
    queryset = ConfirmationRecord.objects.select_related("baptism", "parish")
    serializer_class = ConfirmationSerializer
    builder = staticmethod(_sacrament_builder(ConfirmationRecord))
    filter_backends = [SearchFilter]
    search_fields = _PERSON_SEARCH


class MatrimonyViewSet(ImportMixin, viewsets.ModelViewSet):
    queryset = MatrimonyRecord.objects.select_related("baptism", "parish", "spouse_baptism", "spouse_baptism_parish")
    serializer_class = MatrimonySerializer
    builder = staticmethod(build_matrimony)
    filter_backends = [SearchFilter]
    search_fields = _PERSON_SEARCH + ["spouse_name"]


class DocumentViewSet(mixins.ListModelMixin, mixins.CreateModelMixin,
                      mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = Document.objects.select_related("baptism")
    serializer_class = DocumentSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get("category")
        return qs.filter(category=category) if category else qs

    def perform_create(self, serializer):
        f = self.request.FILES["file"]
        serializer.save(original_name=f.name, size=f.size)

    def perform_destroy(self, instance):
        instance.file.delete(save=False)
        instance.delete()
