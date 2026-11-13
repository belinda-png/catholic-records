
from django import forms
from django.contrib import admin
from django.contrib.auth.hashers import make_password

from .models import (
    EmailOTP,
    ParishAccessCode,
    PendingRegistration,
    StaffProfile,
)


class CentralAdminOnly:
    """Only the central superuser can manage these records."""

    def has_module_permission(self, request):
        return request.user.is_superuser

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_add_permission(self, request):
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


class ParishAccessCodeForm(forms.ModelForm):
    access_code = forms.CharField(
        label="New parish access code",
        required=False,
        widget=forms.PasswordInput(render_value=False),
        help_text=(
            "Enter at least 8 characters. Leave blank when editing "
            "to keep the existing code."
        ),
    )

    class Meta:
        model = ParishAccessCode
        fields = ("parish", "is_active", "access_code")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if not self.instance.pk:
            self.fields["access_code"].required = True

    def clean_access_code(self):
        code = self.cleaned_data.get("access_code", "")

        if not self.instance.pk and not code:
            raise forms.ValidationError("An access code is required.")

        if code and len(code) < 8:
            raise forms.ValidationError("The access code must be at least 8 characters.")

        if code and not any(char.isalpha() for char in code):
            raise forms.ValidationError("The access code must contain at least one letter.")

        if code and not any(char.isdigit() for char in code):
            raise forms.ValidationError("The access code must contain at least one number.")

        if code and not any(not char.isalnum() for char in code):
            raise forms.ValidationError("The access code must contain at least one symbol.")

        return code

    def save(self, commit=True):
        parish_code = super().save(commit=False)

        code = self.cleaned_data.get("access_code")

        if code:
            parish_code.code_hash = make_password(code)

        if commit:
            parish_code.save()
            self.save_m2m()

        return parish_code


@admin.register(StaffProfile)
class StaffProfileAdmin(CentralAdminOnly, admin.ModelAdmin):
    list_display = ("user", "parish", "is_active", "created_at")
    list_filter = ("parish", "is_active")
    search_fields = (
        "user__email",
        "user__username",
        "parish__name",
    )
    list_editable = ("is_active",)


@admin.register(ParishAccessCode)
class ParishAccessCodeAdmin(CentralAdminOnly, admin.ModelAdmin):
    form = ParishAccessCodeForm

    list_display = ("parish", "is_active", "updated_at")
    list_filter = ("is_active", "parish")

    fields = (
        "parish",
        "is_active",
        "access_code",
        "updated_at",
    )

    readonly_fields = ("updated_at",)


@admin.register(EmailOTP)
class EmailOTPAdmin(CentralAdminOnly, admin.ModelAdmin):
    list_display = (
        "email",
        "purpose",
        "expires_at",
        "attempts",
        "is_used",
    )
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

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(PendingRegistration)
class PendingRegistrationAdmin(CentralAdminOnly, admin.ModelAdmin):
    list_display = (
        "full_name",
        "email",
        "parish",
        "created_at",
    )
    search_fields = ("full_name", "email")
    list_filter = ("parish",)
    readonly_fields = ("created_at",)
