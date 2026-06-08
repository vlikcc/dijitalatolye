"""Guard PolicyRule DB kaydına html/htm ekler (admin paneli ile uyum).

Çalıştırma (migrate sonrası bir kez):
  python manage.py shell < /path/to/patch_policy_extensions.py
"""
from __future__ import annotations

import json

from apps.scanner.models import PolicyRule

RULE_KEY = "ALLOWED_EXTENSIONS"
EXTRA = {"html", "htm", "css", "json", "svg", "gif", "woff", "woff2", "ttf", "otf", "ico"}

rule = PolicyRule.objects.filter(key=RULE_KEY, is_active=True).first()
if rule is None:
    print(f"{RULE_KEY} PolicyRule bulunamadı; policy_constants mount yeterli.")
else:
    current = rule.value
    if isinstance(current, str):
        current = json.loads(current)
    merged = sorted(set(current) | EXTRA)
    rule.value = merged
    rule.description = "İzinli uzantı listesi (DijitalAtolye HTML oyun desteği)"
    rule.save(update_fields=["value", "description", "updated_at"])
    print(f"{RULE_KEY} güncellendi: +{sorted(EXTRA)} -> {len(merged)} uzantı")
