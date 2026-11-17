from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import StaffProfile


class ExpiringTokenAuthentication(TokenAuthentication):
    """Token login that never expires. Kept under the old name so settings still work."""
    keyword = "Token"

    def authenticate_credentials(self, key):
        user, token = super().authenticate_credentials(key)

        if not user.is_superuser:
            try:
                profile = user.staff_profile
            except StaffProfile.DoesNotExist:
                raise AuthenticationFailed("Staff profile not found.")

            if not profile.is_active:
                token.delete()
                raise AuthenticationFailed("Your staff account is inactive.")

        return user, token
