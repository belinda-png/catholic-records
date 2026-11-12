
from django.conf import settings
from django.db import models
from django.utils import timezone

from records.models import Parish


class StaffProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="staff_profile",
    )
    parish = models.ForeignKey(
        Parish,
        on_delete=models.PROTECT,
        related_name="staff_members",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.parish.name}"


class ParishAccessCode(models.Model):
    parish = models.OneToOneField(
        Parish,
        on_delete=models.CASCADE,
        related_name="access_code",
    )
    code_hash = models.CharField(max_length=128)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Access code - {self.parish.name}"


class EmailOTP(models.Model):
    PURPOSE_CHOICES = [
        ("REGISTER", "Registration"),
        ("LOGIN", "Login"),
    ]

    email = models.EmailField(db_index=True)
    code_hash = models.CharField(max_length=128)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def has_expired(self):
        return timezone.now() >= self.expires_at

    def __str__(self):
        return f"{self.email} - {self.purpose}"


class PendingRegistration(models.Model):
    full_name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    parish = models.ForeignKey(
        Parish,
        on_delete=models.PROTECT,
        related_name="pending_registrations",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} - {self.email}"
