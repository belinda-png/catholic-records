import os

from django.conf import settings
from rest_framework import serializers

from .models import (BaptismRecord, CommunionRecord, ConfirmationRecord, Document,
                     MatrimonyRecord, Parish)

DOC_EXT = {".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"}
MAX_DOC_MB = 10


class ParishSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parish
        fields = "__all__"


class BaptismSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    age = serializers.IntegerField(read_only=True)
    category = serializers.SerializerMethodField()
    parish_name = serializers.CharField(source="parish.name", read_only=True)

    class Meta:
        model = BaptismRecord
        fields = "__all__"

    def get_category(self, obj):
        if obj.age is None:
            return None
        return "Adult" if obj.age >= settings.ADULT_AGE else "Child"


class _SacramentBase(serializers.ModelSerializer):
    person_name = serializers.CharField(source="baptism.full_name", read_only=True)
    baptism_number = serializers.CharField(source="baptism.registration_number", read_only=True)
    parish_name = serializers.CharField(source="parish.name", read_only=True)


class CommunionSerializer(_SacramentBase):
    class Meta:
        model = CommunionRecord
        fields = "__all__"


class ConfirmationSerializer(_SacramentBase):
    class Meta:
        model = ConfirmationRecord
        fields = "__all__"


class MatrimonySerializer(_SacramentBase):
    spouse_baptism_name = serializers.SerializerMethodField()
    spouse_baptism_parish_name = serializers.SerializerMethodField()

    class Meta:
        model = MatrimonyRecord
        fields = "__all__"

    def get_spouse_baptism_name(self, obj):
        return obj.spouse_baptism.full_name if obj.spouse_baptism else ""

    def get_spouse_baptism_parish_name(self, obj):
        return obj.spouse_baptism_parish.name if obj.spouse_baptism_parish else ""


class DocumentSerializer(serializers.ModelSerializer):
    person_name = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ["id", "file", "category", "baptism", "person_name",
                  "original_name", "size", "uploaded_at"]
        read_only_fields = ["original_name", "size", "uploaded_at"]

    def get_person_name(self, obj):
        return obj.baptism.full_name if obj.baptism else ""

    def validate_file(self, f):
        if os.path.splitext(f.name)[1].lower() not in DOC_EXT:
            raise serializers.ValidationError("Only PDF, Word and image documents (JPG, PNG) can be kept here.")
        if f.size > MAX_DOC_MB * 1024 * 1024:
            raise serializers.ValidationError(f"Files must be under {MAX_DOC_MB} MB.")
        return f
