from django.db import models

# Create your models here.

from django.db import models
from django.conf import settings


class Parish(models.Model):
    name = models.CharField(max_length=200, unique=True)
    location = models.CharField(max_length=200, blank=True)
    archdiocese = models.CharField(
        max_length=200,
        default="Tororo Archdiocese"
    )
    phone_number = models.CharField(max_length=30, blank=True)
    address = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Person(models.Model):
    registration_number = models.CharField(
        max_length=50,
        unique=True
    )
    christian_name = models.CharField(max_length=100)
    surname = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    phone_number = models.CharField(max_length=30, blank=True)

    father_name = models.CharField(max_length=200, blank=True)
    mother_name = models.CharField(max_length=200, blank=True)
    godparent_name = models.CharField(max_length=200, blank=True)
    residence = models.CharField(max_length=255, blank=True)

    # The person's home or registering parish.
    home_parish = models.ForeignKey(
        Parish,
        on_delete=models.PROTECT,
        related_name="people"
    )

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["surname", "christian_name"]

    def __str__(self):
        return f"{self.christian_name} {self.surname}"


class BaptismRecord(models.Model):
    person = models.ForeignKey(
        Person,
        on_delete=models.PROTECT,
        related_name="baptism_records"
    )
    registration_number = models.CharField(max_length=50)
    date_of_baptism = models.DateField()
    parish = models.ForeignKey(
        Parish,
        on_delete=models.PROTECT,
        related_name="baptism_records"
    )
    minister = models.CharField(max_length=200, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_of_baptism"]
        constraints = [
            models.UniqueConstraint(
                fields=["parish", "registration_number"],
                name="unique_baptism_register_per_parish"
            )
        ]

    def __str__(self):
        return f"Baptism: {self.person} ({self.registration_number})"


class CommunionRecord(models.Model):
    person = models.ForeignKey(
        Person,
        on_delete=models.PROTECT,
        related_name="communion_records"
    )
    date_received = models.DateField()
    parish = models.ForeignKey(
        Parish,
        on_delete=models.PROTECT,
        related_name="communion_records"
    )
    minister = models.CharField(max_length=200, blank=True)
    registration_number = models.CharField(max_length=50, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_received"]

    def __str__(self):
        return f"First Holy Communion: {self.person}"


class ConfirmationRecord(models.Model):
    person = models.ForeignKey(
        Person,
        on_delete=models.PROTECT,
        related_name="confirmation_records"
    )
    date_received = models.DateField()
    parish = models.ForeignKey(
        Parish,
        on_delete=models.PROTECT,
        related_name="confirmation_records"
    )
    minister = models.CharField(max_length=200, blank=True)
    registration_number = models.CharField(max_length=50, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_received"]

    def __str__(self):
        return f"Confirmation: {self.person}"



class MatrimonyRecord(models.Model):
    person = models.ForeignKey(
        Person,
        on_delete=models.PROTECT,
        related_name="matrimony_records"
    )

    # Link to the spouse's actual person profile when available.
    spouse = models.ForeignKey(
        Person,
        on_delete=models.PROTECT,
        related_name="spouse_matrimony_records",
        null=True,
        blank=True
    )

    # Preserve the spouse's name exactly as recorded in the marriage register.
    spouse_name = models.CharField(max_length=200)

    date_of_marriage = models.DateField()

    parish = models.ForeignKey(
        Parish,
        on_delete=models.PROTECT,
        related_name="matrimony_records"
    )

    registration_number = models.CharField(max_length=50)

    spouse_baptism_parish = models.ForeignKey(
        Parish,
        on_delete=models.PROTECT,
        related_name="spouse_baptism_references",
        null=True,
        blank=True
    )

    spouse_baptism_registration_number = models.CharField(
        max_length=50,
        blank=True
    )

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_of_marriage"]
        constraints = [
            models.UniqueConstraint(
                fields=["parish", "registration_number"],
                name="unique_marriage_register_per_parish"
            )
        ]

    def __str__(self):
        return f"Matrimony: {self.person} and {self.spouse_name}"
