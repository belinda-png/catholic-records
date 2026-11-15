
# from datetime import timedelta

# from django.utils import timezone
# from rest_framework.authentication import TokenAuthentication
# from rest_framework.exceptions import AuthenticationFailed

# from .models import StaffProfile


# class ExpiringTokenAuthentication(TokenAuthentication):
#     keyword = "Token"

#     def authenticate_credentials(self, key):
#         user, token = super().authenticate_credentials(key)

#         if timezone.now() - token.created > timedelta(days=365):
#             token.delete()
#             raise AuthenticationFailed(
#                 "Your session has expired. Please log in again."
#             )

#         if not user.is_superuser:
#             try:
#                 profile = user.staff_profile
#             except StaffProfile.DoesNotExist:
#                 raise AuthenticationFailed("Staff profile not found.")

#             if not profile.is_active:
#                 token.delete()
#                 raise AuthenticationFailed("Your staff account is inactive.")

#         return user, token
