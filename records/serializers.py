
from rest_framework import serializers
from .models import (
    Parish,
    Person,
    BaptismRecord,
    CommunionRecord,
    ConfirmationRecord,
    MatrimonyRecord,
)


class ParishSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parish
        fields = "__all__"


class PersonSerializer(serializers.ModelSerializer):
    home_parish_name = serializers.CharField(
        source="home_parish.name",
        read_only=True,
    )

    class Meta:
        model = Person
        fields = "__all__"


class BaptismRecordSerializer(serializers.ModelSerializer):
    parish_name = serializers.CharField(
        source="parish.name",
        read_only=True,
    )
    person_name = serializers.SerializerMethodField()

    class Meta:
        model = BaptismRecord
        fields = "__all__"

    def get_person_name(self, obj):
        return str(obj.person)


class CommunionRecordSerializer(serializers.ModelSerializer):
    parish_name = serializers.CharField(
        source="parish.name",
        read_only=True,
    )

    class Meta:
        model = CommunionRecord
        fields = "__all__"


class ConfirmationRecordSerializer(serializers.ModelSerializer):
    parish_name = serializers.CharField(
        source="parish.name",
        read_only=True,
    )

    class Meta:
        model = ConfirmationRecord
        fields = "__all__"


class MatrimonyRecordSerializer(serializers.ModelSerializer):
    parish_name = serializers.CharField(
        source="parish.name",
        read_only=True,
    )
    spouse_profile = PersonSerializer(
        source="spouse",
        read_only=True,
    )

    class Meta:
        model = MatrimonyRecord
        fields = "__all__"
