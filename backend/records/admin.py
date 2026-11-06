from django.contrib import admin

from .models import (BaptismRecord, CommunionRecord, ConfirmationRecord, Document,
                     MatrimonyRecord, Parish)

admin.site.register([Parish, BaptismRecord, CommunionRecord, ConfirmationRecord,
                     MatrimonyRecord, Document])
