"""DijitalAtolye compose override — eğitim içeriği için HTML uzantıları.

Guard imajındaki varsayılan liste yalnızca ofis/medya/arşiv uzantılarını içerir.
Ana site .zip / .html / .htm yüklemeye izin verdiği için burada genişletilir.
"""
from __future__ import annotations

ALLOWED_EXTENSIONS: frozenset[str] = frozenset({
    "pdf",
    "docx", "pptx", "xlsx",
    "jpg", "jpeg", "png", "webp", "svg",
    "mp4", "mp3", "wav",
    "txt",
    "zip", "rar", "7z",
    # Tek dosya HTML oyunları (Content.API ile uyumlu)
    "html", "htm",
    # ZIP içindeki statik asset'ler (BundleValidator ile uyumlu)
    "css", "json", "woff", "woff2", "ttf", "otf", "ico", "gif",
})

BLOCKED_EXTENSIONS: frozenset[str] = frozenset({
    "exe", "msi", "bat", "cmd", "ps1", "vbs",
    "js", "jse", "jar", "scr", "com", "dll",
    "hta", "reg", "lnk", "iso", "img",
    "apk", "dmg", "pkg",
    "php", "asp", "aspx", "jsp", "py", "sh",
    "docm", "xlsm", "pptm",
})

ARCHIVE_EXTENSIONS: frozenset[str] = frozenset({"zip", "rar", "7z"})

EXTENSION_MIME_HINTS: dict[str, set[str]] = {
    "pdf": {"application/pdf"},
    "docx": {"application/vnd.openxmlformats-officedocument", "application/zip"},
    "xlsx": {"application/vnd.openxmlformats-officedocument", "application/zip"},
    "pptx": {"application/vnd.openxmlformats-officedocument", "application/zip"},
    "jpg": {"image/jpeg"},
    "jpeg": {"image/jpeg"},
    "png": {"image/png"},
    "webp": {"image/webp"},
    "svg": {"image/svg+xml", "text/plain", "application/xml"},
    "gif": {"image/gif"},
    "mp4": {"video/mp4", "application/mp4"},
    "mp3": {"audio/mpeg"},
    "wav": {"audio/x-wav", "audio/wav"},
    "txt": {"text/plain"},
    "html": {"text/html", "application/xhtml+xml"},
    "htm": {"text/html", "application/xhtml+xml"},
    "css": {"text/css", "text/plain"},
    "json": {"application/json", "text/plain"},
    "woff": {"font/woff", "application/font-woff", "application/octet-stream"},
    "woff2": {"font/woff2", "application/octet-stream"},
    "ttf": {"font/ttf", "application/octet-stream", "font/sfnt"},
    "otf": {"font/otf", "application/octet-stream", "font/sfnt"},
    "ico": {"image/x-icon", "image/vnd.microsoft.icon"},
    "zip": {"application/zip"},
    "rar": {"application/x-rar", "application/vnd.rar"},
    "7z": {"application/x-7z-compressed"},
}

DANGEROUS_MIMES: frozenset[str] = frozenset({
    "application/x-dosexec",
    "application/x-msdownload",
    "application/x-executable",
    "application/x-mach-binary",
    "application/vnd.microsoft.portable-executable",
    "application/x-msi",
    "application/x-shellscript",
    "application/x-sharedlib",
    "application/x-elf",
})
