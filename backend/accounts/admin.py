from django.contrib import admin

# Register your models here.

from django.contrib import admin

from .models import EmailOTP, ParishAccessCode, StaffProfile

from .models import (
    EmailOTP,
    ParishAccessCode,
    PendingRegistration,
    StaffProfile,
)
@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "parish", "is_active", "created_at")
    list_filter = ("parish", "is_active")
    search_fields = ("user__email", "user__username", "parish__name")
    list_editable = ("is_active",)


@admin.register(ParishAccessCode)
class ParishAccessCodeAdmin(admin.ModelAdmin):
    list_display = ("parish", "is_active", "updated_at")
    list_filter = ("is_active", "parish")
    readonly_fields = ("code_hash", "updated_at")


@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
    list_display = ("email", "purpose", "expires_at", "attempts", "is_used")
    list_filter = ("purpose", "is_used")
    search_fields = ("email",)
    readonly_fields = (
        "email",
        "code_hash",
        "purpose",
        "expires_at",
        "attempts",
        "is_used",
        "created_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
@admin.register(PendingRegistration)
class PendingRegistrationAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "parish", "created_at")
    search_fields = ("full_name", "email")
    list_filter = ("parish",)
    readonly_fields = ("created_at",)
