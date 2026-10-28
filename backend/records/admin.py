from django.contrib import admin

# Register your models here.

from django.contrib import admin
from .models import (
    Parish,
    Person,
    BaptismRecord,
    CommunionRecord,
    ConfirmationRecord,
    MatrimonyRecord,
)


@admin.register(Parish)
class ParishAdmin(admin.ModelAdmin):
    list_display = ("name", "location", "archdiocese", "is_active")
    search_fields = ("name", "location")
    list_filter = ("archdiocese", "is_active")


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = (
        "registration_number",
        "christian_name",
        "surname",
        "home_parish",
    )
    search_fields = (
        "registration_number",
        "christian_name",
        "surname",
        "father_name",
        "mother_name",
    )
    list_filter = ("home_parish",)
    list_select_related = ("home_parish",)


@admin.register(BaptismRecord)
class BaptismRecordAdmin(admin.ModelAdmin):
    list_display = (
        "registration_number",
        "person",
        "date_of_baptism",
        "parish",
        "minister",
    )
    search_fields = (
        "registration_number",
        "person__christian_name",
        "person__surname",
    )
    list_filter = ("parish", "date_of_baptism")


@admin.register(CommunionRecord)
class CommunionRecordAdmin(admin.ModelAdmin):
    list_display = ("person", "date_received", "parish", "minister")
    search_fields = ("person__christian_name", "person__surname")
    list_filter = ("parish", "date_received")


@admin.register(ConfirmationRecord)
class ConfirmationRecordAdmin(admin.ModelAdmin):
    list_display = ("person", "date_received", "parish", "minister")
    search_fields = ("person__christian_name", "person__surname")
    list_filter = ("parish", "date_received")


@admin.register(MatrimonyRecord)
class MatrimonyRecordAdmin(admin.ModelAdmin):
    list_display = (
        "person",
        "spouse_name",
        "date_of_marriage",
        "parish",
        "registration_number",
    )
    search_fields = (
        "registration_number",
        "person__christian_name",
        "person__surname",
        "spouse_name",
    )
    list_filter = ("parish", "date_of_marriage")
