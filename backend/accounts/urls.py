from django.urls import path

from .views import (
    RegistrationOTPView,
    CompleteRegistrationView,
    LoginOTPView,
    VerifyLoginOTPView,
    public_parishes,
    admin_overview,
    admin_create_parish,
    admin_reset_parish_code,
)

urlpatterns = [
    path("admin-overview/", admin_overview),
    path("register/", RegistrationOTPView.as_view(), name="register"),
    path("register/complete/", CompleteRegistrationView.as_view(), name="complete-registration"),
    path("login/", LoginOTPView.as_view(), name="login"),
    path("login/verify/", VerifyLoginOTPView.as_view(), name="verify-login"),
    path("parishes/", public_parishes, name="public-parishes"),
    path("admin-parishes/", admin_create_parish),
path("admin-parishes/<int:parish_id>/reset-code/", admin_reset_parish_code),
]