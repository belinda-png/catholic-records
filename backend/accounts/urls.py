from django.urls import path

from .views import (
    RegistrationOTPView,
    CompleteRegistrationView,
    LoginOTPView,
    VerifyLoginOTPView,
    public_parishes,
)

urlpatterns = [
    path("register/", RegistrationOTPView.as_view(), name="register"),
    path("register/complete/", CompleteRegistrationView.as_view(), name="complete-registration"),
    path("login/", LoginOTPView.as_view(), name="login"),
    path("login/verify/", VerifyLoginOTPView.as_view(), name="verify-login"),
    path("parishes/", public_parishes, name="public-parishes"),
]