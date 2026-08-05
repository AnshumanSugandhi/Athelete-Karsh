# accounts/apps.py
from django.apps import AppConfig

class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        """
        This method runs as soon as the app is loaded.
        We import our signals here so Django starts listening for them.
        """
        import accounts.signals