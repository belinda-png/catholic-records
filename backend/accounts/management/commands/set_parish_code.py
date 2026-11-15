import secrets

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand

from accounts.models import ParishAccessCode
from records.models import Parish


class Command(BaseCommand):
    help = "Create or reset the access code of every active parish (or one with --parish ID)."

    def add_arguments(self, parser):
        parser.add_argument("--parish", type=int, default=None, help="Parish id")

    def handle(self, *args, **opts):
        parishes = Parish.objects.filter(is_active=True)
        if opts.get("parish"):
            parishes = parishes.filter(id=opts["parish"])

        for p in parishes:
            code = secrets.token_hex(3).upper()
            ParishAccessCode.objects.update_or_create(
                parish=p,
                defaults={
                    "code_hash": make_password(code),
                    "code_plain": code,
                    "is_active": True,
                },
            )
            self.stdout.write(f"{p.id}  {p.name}:  {code}")

        self.stdout.write(self.style.WARNING("Write these down. Each run replaces all codes."))