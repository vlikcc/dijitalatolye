"""DijitalAtolye docker compose: prod ayarlari + localhost HTTP panel erisimi.

Guard React paneli http://localhost:18000 uzerinden nginx ile sunulur (TLS yok).
Prod'da SESSION/CSRF cookie'ler Secure=True oldugundan tarayici HTTP'de oturum tutmaz.
Axios CSRF header'i icin csrftoken cookie'sinin JS tarafindan okunabilir olmasi gerekir.
"""
from .prod import *  # noqa: F401,F403

# localhost:18000 — plain HTTP nginx; prod Secure/SSL redirect devre disi
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = False
SECURE_SSL_REDIRECT = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
