from datetime import date

from django.db import models
from django.db.models import Q


def age_on(born, on=None):
    on = on or date.today()
    return on.year - born.year - ((on.month, on.day) < (born.month, born.day))


class Parish(models.Model):
    name = models.CharField(max_length=200, unique=True)
    location = models.CharField(max_length=200, blank=True)
    archdiocese = models.CharField(max_length=200, default="Tororo Archdiocese")
    phone_number = models.CharField(max_length=30, blank=True)
    address = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class BaptismRecord(models.Model):
    """A person enters the register ONLY through their baptism, so the
    person's details live here. There is no separate Person model."""

    registration_number = models.CharField(max_length=50)
    parish = models.ForeignKey(Parish, on_delete=models.PROTECT, related_name="baptism_records")
    date_of_baptism = models.DateField(null=True, blank=True)
    christian_name = models.CharField(max_length=100)
    surname = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    phone_number = models.CharField(max_length=30, blank=True)
    father_name = models.CharField(max_length=200, blank=True)
    mother_name = models.CharField(max_length=200, blank=True)
    godparent_name = models.CharField(max_length=200, blank=True)
    residence = models.CharField(max_length=255, blank=True)
    # The person's home parish (defaults to the baptising parish).
    home_parish = models.ForeignKey(Parish, on_delete=models.PROTECT, related_name="people",
                                    null=True, blank=True)

    date_of_baptism = models.DateField()
    minister = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]  # same order the records were entered or imported
        constraints = [
            models.UniqueConstraint(fields=["parish", "registration_number"],
                                    name="unique_baptism_register_per_parish"),
        ]

    @property
    def full_name(self):
        return f"{self.christian_name} {self.surname}"

    @property
    def age(self):
        """Age on the day of baptism (None if the date of birth is unknown)."""
        if not self.date_of_birth:
            return None
        return age_on(self.date_of_birth, self.date_of_baptism)

    def save(self, *args, **kwargs):
        if not self.home_parish_id:
            self.home_parish = self.parish
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} (Baptism No. {self.registration_number})"


class CommunionRecord(models.Model):
    baptism = models.ForeignKey(BaptismRecord, on_delete=models.PROTECT, related_name="communion_records")
    registration_number = models.CharField(max_length=50, blank=True)
    date_received = models.DateField()
    parish = models.ForeignKey(Parish, on_delete=models.PROTECT, related_name="communion_records")
    minister = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(fields=["parish", "registration_number"],
                                    condition=~Q(registration_number=""),
                                    name="unique_communion_register_per_parish"),
        ]

    def __str__(self):
        return f"First Holy Communion: {self.baptism.full_name}"


class ConfirmationRecord(models.Model):
    baptism = models.ForeignKey(BaptismRecord, on_delete=models.PROTECT, related_name="confirmation_records")
    registration_number = models.CharField(max_length=50, blank=True)
    date_received = models.DateField()
    parish = models.ForeignKey(Parish, on_delete=models.PROTECT, related_name="confirmation_records")
    minister = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(fields=["parish", "registration_number"],
                                    condition=~Q(registration_number=""),
                                    name="unique_confirmation_register_per_parish"),
        ]

    def __str__(self):
        return f"Confirmation: {self.baptism.full_name}"


class MatrimonyRecord(models.Model):
    baptism = models.ForeignKey(BaptismRecord, on_delete=models.PROTECT, related_name="matrimony_records")
    # Spouse's baptism record, when the spouse was baptised in this register.
    spouse_baptism = models.ForeignKey(BaptismRecord, on_delete=models.PROTECT,
                                       related_name="spouse_matrimony_records", null=True, blank=True)
    # Spouse's name exactly as written in the marriage register.
    spouse_name = models.CharField(max_length=200)

    registration_number = models.CharField(max_length=50, blank=True)  # was missing in your version
    date_of_marriage = models.DateField()
    parish = models.ForeignKey(Parish, on_delete=models.PROTECT, related_name="matrimony_records")

    # For a spouse baptised somewhere else.
    spouse_baptism_parish = models.ForeignKey(Parish, on_delete=models.PROTECT,
                                              related_name="spouse_baptism_references",
                                              null=True, blank=True)
    spouse_baptism_registration_number = models.CharField(max_length=50, blank=True)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(fields=["parish", "registration_number"],
                                    condition=~Q(registration_number=""),
                                    name="unique_marriage_register_per_parish"),
        ]

    def __str__(self):
        return f"Matrimony: {self.baptism.full_name} and {self.spouse_name}"


class Document(models.Model):
    """One document store for every sacrament."""
    BAPTISM, COMMUNION, CONFIRMATION, MARRIAGE, OTHER = (
        "BAPTISM", "COMMUNION", "CONFIRMATION", "MARRIAGE", "OTHER")
    CATEGORIES = [
        (BAPTISM, "Baptism"),
        (COMMUNION, "First Holy Communion"),
        (CONFIRMATION, "Confirmation"),
        (MARRIAGE, "Marriage"),
        (OTHER, "Other"),
    ]

    file = models.FileField(upload_to="documents/%Y/%m/")
    category = models.CharField(max_length=15, choices=CATEGORIES, default=OTHER)
    baptism = models.ForeignKey(BaptismRecord, on_delete=models.SET_NULL,
                                null=True, blank=True, related_name="documents")
    original_name = models.CharField(max_length=255)
    size = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.original_name
