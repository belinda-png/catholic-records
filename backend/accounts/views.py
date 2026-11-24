
from datetime import timedelta
import secrets

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from django.utils.crypto import get_random_string

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.db.models import Count
from records.models import Parish
from .models import (
    EmailOTP,
    ParishAccessCode,
    PendingRegistration,
    StaffProfile,
)
from django.utils.html import escape
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from records.models import Parish


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def public_parishes(request):
    return Response(list(Parish.objects.filter(is_active=True).values("id", "name")))
User = get_user_model()


def generate_username(email):
    """
    Generate a valid, unique username from an email address.
    Symbols in the email are not copied into the username.
    """
    local_part = email.split("@")[0]

    username = "".join(
        char for char in local_part if char.isalnum() or char in "@.+-_"
    )

    username = username[:140] or "staff"

    original = username
    counter = 1

    while User.objects.filter(username=username).exists():
        suffix = str(counter)
        username = f"{original[:150 - len(suffix)]}{suffix}"
        counter += 1

    return username


def send_otp(email, purpose, full_name="", parish=None, access_code=None):
    """Generate and email a six-digit OTP."""
    code = get_random_string(6, allowed_chars="0123456789")

    EmailOTP.objects.filter(
        email=email,
        purpose=purpose,
        is_used=False,
    ).delete()

    EmailOTP.objects.create(
        email=email,
        code_hash=make_password(code),
        purpose=purpose,
        expires_at=timezone.now() + timedelta(minutes=10),
    )
    greeting = f"Hello {full_name},\n\n" if full_name else ""

    message = (
        f"{greeting}"
        f"Your verification code is {code}.\n\n"
        "It expires in 10 minutes. Do not share this code with anyone."
    )

    if parish and access_code:
        message += f"\n\nYour parish access code for {parish.name} is: {access_code}"

    html_message = (
        f"<p>Hello {escape(full_name)},</p>" if full_name else ""
    ) + (
        f"<p>Your verification code: <b>{code}</b> (expires in 10 minutes)</p>"
        "<p>Do not share this code with anyone.</p>"
    )

    if parish and access_code:
        html_message += (
            f"<p>Your parish access code for {escape(parish.name)}: "
            f"<b>{escape(access_code)}</b></p>"
        )

    send_mail(
        subject="Your Catholic Sacramental Records verification code",
        message=message,
        html_message=html_message,
        from_email=None,
        recipient_list=[email],
        fail_silently=False,
    )


def get_valid_otp(email, purpose):
    return EmailOTP.objects.filter(
        email=email,
        purpose=purpose,
        is_used=False,
    ).order_by("-created_at").first()


def create_login_token(user):
    token, _ = Token.objects.get_or_create(user=user)
    token.created = timezone.now()
    token.save(update_fields=["created"])
    user.last_login = timezone.now()
    user.save(update_fields=["last_login"])
    return token


def user_response(user, token):
    is_admin = user.is_superuser

    profile = None
    if not is_admin:
        profile = user.staff_profile

    return {
        "token": token.key,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.first_name,
            "role": "admin" if is_admin else "staff",
            "parish_id": profile.parish_id if profile else None,
            "parish_name": profile.parish.name if profile else None,
        },
    }
class RegistrationOTPView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        full_name = request.data.get("full_name", "").strip()
        email = request.data.get("email", "").strip().lower()
        parish_id = request.data.get("parish_id")

        if not full_name or not email or not parish_id:
            return Response(
                {"error": "Full name, email and parish are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(email__iexact=email).exists():
            return Response(
                {"error": "An account with this email already exists. Please log in."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            parish = Parish.objects.get(id=parish_id, is_active=True)
        except (Parish.DoesNotExist, ValueError, TypeError):
            return Response(
                {"error": "Please select a valid active parish."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            parish_code = ParishAccessCode.objects.get(parish=parish, is_active=True)
        except ParishAccessCode.DoesNotExist:
            return Response(
                {"error": "This parish does not currently have an active access code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        PendingRegistration.objects.update_or_create(
            email=email,
            defaults={"full_name": full_name, "parish": parish},
        )

        try:
            send_otp(
                email,
                "REGISTER",
                full_name=full_name,
                parish=parish,
                access_code=parish_code.get_code(),
            )
        except Exception:
            return Response(
                {"error": "We could not send your email code. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"message": "A verification code has been sent to your email."},
            status=status.HTTP_200_OK,
        )


class CompleteRegistrationView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        code = request.data.get("otp", "").strip()
        access_code = request.data.get("parish_access_code", "").strip()

        if not email or not code or not access_code:
            return Response(
                {"error": "Email, OTP and parish access code are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp = get_valid_otp(email, "REGISTER")

        if not otp:
            return Response(
                {"error": "No active registration code found. Request a new code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp.attempts >= 5:
            otp.is_used = True
            otp.save(update_fields=["is_used"])
            return Response(
                {"error": "Too many attempts. Please request a new code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp.has_expired():
            otp.is_used = True
            otp.save(update_fields=["is_used"])
            return Response(
                {"error": "Your verification code has expired. Request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not check_password(code, otp.code_hash):
            otp.attempts += 1
            otp.save(update_fields=["attempts"])
            return Response(
                {"error": "Incorrect verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            pending = PendingRegistration.objects.get(email=email)
        except PendingRegistration.DoesNotExist:
            return Response(
                {"error": "Registration details not found. Please register again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            parish_code = ParishAccessCode.objects.get(
                parish=pending.parish,
                is_active=True,
            )
        except ParishAccessCode.DoesNotExist:
            return Response(
                {"error": "This parish does not currently have an active access code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not check_password(access_code, parish_code.code_hash):
            otp.attempts += 1
            otp.save(update_fields=["attempts"])
            return Response(
                {"error": "Incorrect parish access code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            if User.objects.filter(email__iexact=email).exists():
                return Response(
                    {"error": "An account with this email already exists."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            username = generate_username(email)

            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=pending.full_name[:150],
            )

            user.set_unusable_password()
            user.save()

            StaffProfile.objects.create(
                user=user,
                parish=pending.parish,
            )

            pending.delete()

            otp.is_used = True
            otp.save(update_fields=["is_used"])

            token = create_login_token(user)

        return Response(
            {
                "message": "Your staff account has been created successfully.",
                **user_response(user, token),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginOTPView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()

        if not email:
            return Response(
                {"error": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=email).first()

        if not user or not user.is_active:
            return Response(
                {"error": "No active account found with this email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_superuser:
            try:
                profile = user.staff_profile
            except StaffProfile.DoesNotExist:
                return Response(
                    {"error": "This account is not registered as parish staff."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if not profile.is_active:
                return Response(
                    {"error": "Your staff account is inactive. Contact the administrator."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        try:
            send_otp(email, "LOGIN")
        except Exception:
            return Response(
                {"error": "We could not send your email code. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"message": "A login verification code has been sent to your email."},
            status=status.HTTP_200_OK,
        )


class VerifyLoginOTPView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        code = request.data.get("otp", "").strip()

        if not email or not code:
            return Response(
                {"error": "Email and OTP are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp = get_valid_otp(email, "LOGIN")

        if not otp:
            return Response(
                {"error": "No active login code found. Request a new code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp.attempts >= 5:
            otp.is_used = True
            otp.save(update_fields=["is_used"])
            return Response(
                {"error": "Too many attempts. Please request a new code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp.has_expired():
            otp.is_used = True
            otp.save(update_fields=["is_used"])
            return Response(
                {"error": "Your login code has expired. Request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not check_password(code, otp.code_hash):
            otp.attempts += 1
            otp.save(update_fields=["attempts"])
            return Response(
                {"error": "Incorrect verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(
            email__iexact=email,
            is_active=True,
        ).first()

        if not user:
            return Response(
                {"error": "This account is no longer active."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not user.is_superuser:
            try:
                profile = user.staff_profile
            except StaffProfile.DoesNotExist:
                return Response(
                    {"error": "Staff profile not found."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if not profile.is_active:
                return Response(
                    {"error": "Your staff account is inactive."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        otp.is_used = True
        otp.save(update_fields=["is_used"])

        token = create_login_token(user)

        return Response(
            {
                "message": "Login successful.",
                **user_response(user, token),
            },
            status=status.HTTP_200_OK,
        )
@api_view(["GET"])
def admin_overview(request):
    if not request.user.is_superuser:
        return Response({"detail": "Admins only."}, status=403)

    staff = [
        {
            "id": s.user_id,
            "name": s.user.first_name,
            "email": s.user.email,
            "parish": s.parish.name,
            "is_active": s.is_active and s.user.is_active,
            "last_login": s.user.last_login,
            "joined": s.user.date_joined,
        }
        for s in StaffProfile.objects.select_related("user", "parish").order_by("parish__name", "user__first_name")
    ]

    codes = {c.parish_id: c.code_plain for c in ParishAccessCode.objects.all()}
    parishes = [
        {**p, "access_code": codes.get(p["id"], "")}
        for p in Parish.objects.annotate(
            baptisms=Count("baptism_records", distinct=True),
            communions=Count("communion_records", distinct=True),
            confirmations=Count("confirmation_records", distinct=True),
            matrimonies=Count("matrimony_records", distinct=True),
        ).values("id", "name", "is_active", "baptisms", "communions", "confirmations", "matrimonies")
    ]
    pending = list(PendingRegistration.objects.values("email", "full_name", "parish__name"))
    return Response({"staff": staff, "parishes": parishes, "pending": pending})


@api_view(["POST"])
def admin_create_parish(request):
    if not request.user.is_superuser:
        return Response({"detail": "Admins only."}, status=403)

    name = (request.data.get("name") or "").strip()
    location = (request.data.get("location") or "").strip()
    if not name:
        return Response({"error": "Enter the parish name."}, status=400)
    if Parish.objects.filter(name__iexact=name).exists():
        return Response({"error": "A parish with this name already exists."}, status=400)

    parish = Parish.objects.create(name=name, location=location, is_active=True)
    access = ParishAccessCode.objects.filter(parish=parish).first()
    return Response(
        {"id": parish.id, "name": parish.name, "access_code": access.code_plain if access else ""},
        status=201,
    )


@api_view(["POST"])
def admin_reset_parish_code(request, parish_id):
    if not request.user.is_superuser:
        return Response({"detail": "Admins only."}, status=403)

    try:
        parish = Parish.objects.get(id=parish_id)
    except Parish.DoesNotExist:
        return Response({"error": "Parish not found."}, status=404)

    code = secrets.token_hex(3).upper()
    ParishAccessCode.objects.update_or_create(
        parish=parish,
        defaults={"code_hash": make_password(code), "code_plain": code, "is_active": True},
    )
    return Response({"id": parish.id, "access_code": code})