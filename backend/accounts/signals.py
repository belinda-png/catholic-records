import secrets

from django.contrib.auth.hashers import make_password
from django.db.models.signals import post_save
from django.dispatch import receiver

from records.models import Parish
from .models import ParishAccessCode


@receiver(post_save, sender=Parish)
def create_parish_access_code(sender, instance, created, **kwargs):
    if created:
        code = secrets.token_hex(3).upper()
        ParishAccessCode.objects.get_or_create(
            parish=instance,
            defaults={"code_hash": make_password(code), "code_plain": code, "is_active": True},
        )