from pathlib import Path
import os
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent



# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-(6&+@qnq+rotd_11z@^v%e*#)%s@ecic_kjgo^*718h9xm^=8('

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET')


ALLOWED_HOSTS = []


# Application definition

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party apps
    # Required for allauth to work properly
    'django.contrib.sites',
    
    # API Framework & Authentication
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    
    # Social Auth
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'corsheaders',  # Add this anywhere in the list
    'dj_rest_auth',
    'dj_rest_auth.registration',
    
    # Local apps
    'accounts',
    'sports',
    'bookings',
    'learning',
    'chat',
    'channels',
    'performance',
]


MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # MUST BE ADDED HERE
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'
ASGI_APPLICATION = 'core.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}




# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
# 2. Tell allauth which site ID to use
SITE_ID = 1

# 3. Configure REST Framework to strictly use JWTs for authentication

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        # Used by the React frontend via tokens
        'dj_rest_auth.jwt_auth.JWTCookieAuthentication',
        
        # Add this line so your browser session from the Admin panel works!
        'rest_framework.authentication.SessionAuthentication',
    )
}

# 4. Configure dj-rest-auth to use JWTs instead of standard tokens
REST_AUTH = {
    'USE_JWT': True,
    'JWT_AUTH_COOKIE': 'my-app-auth',
    'JWT_AUTH_REFRESH_COOKIE': 'my-refresh-token',
    'JWT_AUTH_HTTPONLY': False,
    'USER_DETAILS_SERIALIZER': 'accounts.serializers.UserSerializer',
    'REGISTER_SERIALIZER': 'accounts.serializers.CustomRegisterSerializer',

}

# 5. Disable email verification for now (since HR creates the professional accounts)
ACCOUNT_EMAIL_VERIFICATION = 'none'

ACCOUNT_LOGIN_METHODS = {'username', 'email'}
ACCOUNT_SIGNUP_FIELDS = ['email*', 'username*', 'password1*', 'password2*']



ACCOUNT_AUTHENTICATION_METHOD = 'username_email'
ACCOUNT_EMAIL_REQUIRED = True
# 2. Tell Django to use our custom user model (Format: 'app_name.ModelName')
AUTH_USER_MODEL = 'accounts.CustomUser'

# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = 'static/'

# core/settings.py (at the bottom)

# CORS Configuration
# Whitelist the specific frontend URLs that are allowed to make API calls
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Standard Create React App port
    "http://localhost:5173",
    "http://localhost:5174",# Standard Vite React port
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

# Allow cookies to be sent across domains (vital for maintaining login sessions)
CORS_ALLOW_CREDENTIALS = True


import os

# Media files (Avatars, uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Social Account Providers Configuration
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'APP': {
            # Use environment variables for production security
            'client_id': os.environ.get('GOOGLE_CLIENT_ID', 'YOUR_GOOGLE_CLIENT_ID'),
            'secret': os.environ.get('GOOGLE_CLIENT_SECRET', 'YOUR_GOOGLE_CLIENT_SECRET'),
            'key': ''
        },
        'SCOPE': [
            'profile',
            'email',
        ],
        'AUTH_PARAMS': {
            'access_type': 'online',
        }
    }
}