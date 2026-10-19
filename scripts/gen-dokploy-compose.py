#!/usr/bin/env python3
"""
deploy/docker-compose/docker-compose.prod.yml (+ include'ları) -> deploy/docker-compose/docker-compose.dokploy.yml

Dokploy tek bir compose dosyası çalıştırır ve alan adı (Traefik) etiketlerini o dosyadaki servise
kendisi ekler; include/override zinciri kullanılamaz. Bu script prod compose'u birleşik hale getirip
Dokploy'a uyarlar. Tek kaynak prod compose'dur — orada değişiklik yaptıktan sonra yeniden üretin:

    python3 scripts/gen-dokploy-compose.py

Dönüşümler:
  - build / container_name kaldırılır: imajlar CI'ın yayınladığı ${IMAGE_REPO}-<svc>:${IMAGE_TAG}
  - host portları kaldırılır (paylaşımlı sunucuda çakışma olmasın); yalnızca Guard paneli
    127.0.0.1'de kalır (SSH tüneli ile erişim)
  - yalnızca profil ile açılan servisler (mailhog, prometheus, grafana) çıkarılır
  - Caddy: TLS'i Traefik sonlandırır -> Caddyfile.dokploy (:80, düz HTTP)
  - volume/network adları proje ön ekine bırakılır (Dokploy appName)
${VAR} yer tutucuları korunur; değerler Dokploy ortam değişkenlerinden gelir.
"""
import json
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
COMPOSE_DIR = os.path.join(ROOT, "deploy", "docker-compose")
SRC = os.path.join(COMPOSE_DIR, "docker-compose.prod.yml")
OUT = os.path.join(COMPOSE_DIR, "docker-compose.dokploy.yml")
EXAMPLE_ENV = os.path.join(ROOT, ".env.prod.example")

DROP_SERVICES = {"mailhog", "prometheus", "grafana"}
KEEP_LOCAL_PORTS = {"guard-nginx": ["127.0.0.1:${GUARD_HTTP_PORT:-18000}:80"]}


def render() -> dict:
    # 'config' zorunlu (:?) değişkenleri doğrular; örnek env'deki boş değerleri sahte değerle doldur.
    with tempfile.NamedTemporaryFile("w", suffix=".env", delete=False) as tmp:
        for line in open(EXAMPLE_ENV, encoding="utf-8"):
            m = re.match(r"^([A-Z0-9_]+)=(.*)$", line.rstrip("\n"))
            if m:
                tmp.write(f"{m.group(1)}={m.group(2) or 'placeholder-value-123456'}\n")
        env_path = tmp.name
    try:
        out = subprocess.run(
            ["docker", "compose", "-f", SRC, "--env-file", env_path,
             "config", "--no-interpolate", "--format", "json"],
            check=True, capture_output=True, text=True,
        ).stdout
    finally:
        os.unlink(env_path)
    return json.loads(out)


def relativize(path: str) -> str:
    if path.startswith(COMPOSE_DIR + os.sep):
        return "./" + os.path.relpath(path, COMPOSE_DIR)
    return path


def transform(c: dict) -> dict:
    services = {}
    for name, svc in c["services"].items():
        if name in DROP_SERVICES:
            continue
        svc.pop("build", None)
        svc.pop("container_name", None)
        svc.pop("profiles", None)
        if name in KEEP_LOCAL_PORTS:
            svc["ports"] = KEEP_LOCAL_PORTS[name]
        else:
            svc.pop("ports", None)
        for vol in svc.get("volumes", []) or []:
            if vol.get("type") == "bind":
                vol["source"] = relativize(vol["source"])
        if "env_file" in svc:
            for ef in svc["env_file"]:
                ef["path"] = relativize(ef["path"])
        # Kaldırılan servislere bağımlılık kalmasın
        if isinstance(svc.get("depends_on"), dict):
            for dropped in DROP_SERVICES:
                svc["depends_on"].pop(dropped, None)
        services[name] = svc

    caddy = services["caddy"]
    caddy["volumes"] = [
        {"type": "bind", "source": "./caddy", "target": "/etc/caddy", "read_only": True},
        *[v for v in caddy["volumes"] if v.get("type") != "bind"],
    ]
    caddy["command"] = ["caddy", "run", "--config", "/etc/caddy/Caddyfile.dokploy", "--adapter", "caddyfile"]
    caddy["expose"] = ["80"]
    caddy.get("environment", {}).pop("ACME_EMAIL", None)

    networks = {k: {key: val for key, val in v.items() if key != "name"} for k, v in c.get("networks", {}).items()}
    used_volumes = {
        v["source"] for s in services.values() for v in s.get("volumes", []) or [] if v.get("type") == "volume"
    }
    volumes = {k: {} for k in c.get("volumes", {}) if k in used_volumes}
    return {"services": services, "networks": networks, "volumes": volumes}


# --- Minimal YAML yazıcı (PyYAML gerektirmesin). Skalerler JSON biçiminde yazılır; JSON string'i
# geçerli bir YAML çift tırnaklı skaleridir.
def emit(value, indent=0) -> list[str]:
    pad = "  " * indent
    lines = []
    if isinstance(value, dict):
        if not value:
            return [pad + "{}"]
        for k, v in value.items():
            key = json.dumps(k) if not re.match(r"^[A-Za-z0-9_.\-]+$", k) else k
            if isinstance(v, (dict, list)) and v:
                lines.append(f"{pad}{key}:")
                lines.extend(emit(v, indent + 1))
            else:
                lines.append(f"{pad}{key}: {scalar(v)}")
    elif isinstance(value, list):
        if not value:
            return [pad + "[]"]
        for item in value:
            if isinstance(item, (dict, list)) and item:
                sub = emit(item, indent + 1)
                lines.append(f"{pad}- {sub[0].lstrip()}")
                lines.extend(sub[1:])
            else:
                lines.append(f"{pad}- {scalar(item)}")
    else:
        lines.append(pad + scalar(value))
    return lines


def scalar(v) -> str:
    if isinstance(v, dict):
        return "{}"
    if isinstance(v, list):
        return "[]"
    if v is None:
        return "null"
    return json.dumps(v, ensure_ascii=False)


def main() -> int:
    data = transform(render())
    header = (
        "# OTOMATIK URETILIR — elle duzenlemeyin.\n"
        "# Kaynak: docker-compose.prod.yml  |  Uretici: python3 scripts/gen-dokploy-compose.py\n"
        "# Dokploy (Traefik) icin: host portu yok, TLS Traefik'te, imajlar GHCR'dan (IMAGE_REPO/IMAGE_TAG).\n"
    )
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(header + "\n".join(emit(data)) + "\n")
    print(f"yazildi: {os.path.relpath(OUT, ROOT)} ({len(data['services'])} servis)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
