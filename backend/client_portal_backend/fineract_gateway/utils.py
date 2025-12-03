# BACKEND-PLACEHOLDER-START
"""
REVIEW NOTE: This file was updated to construct real HTTP headers for the Fineract
admin API using environment-driven config. No secrets are stored in code; headers
are built at runtime. Raw payloads should be logged only at DEBUG (outside this file).
"""

import base64
import uuid
from .config import get_config


def gen_correlation_id() -> str:
    # BACKEND-PLACEHOLDER-START
    return str(uuid.uuid4())
    # BACKEND-PLACEHOLDER-END


def build_base_headers(tenant: str, correlation_id: str) -> dict:
    # BACKEND-PLACEHOLDER-START
    return {
        "Fineract-Platform-TenantId": tenant or "",
        "X-Correlation-Id": correlation_id,
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    # BACKEND-PLACEHOLDER-END


def build_basic_auth_header(username: str, password: str) -> dict:
    # BACKEND-PLACEHOLDER-START
    userpass = f"{username}:{password}".encode("utf-8")
    token = base64.b64encode(userpass).decode("ascii")
    return {"Authorization": f"Basic {token}"}
    # BACKEND-PLACEHOLDER-END


def build_headers_from_config(correlation_id: str) -> dict:
    # BACKEND-PLACEHOLDER-START
    cfg = get_config()
    headers = build_base_headers(cfg.get("tenant", ""), correlation_id)
    if cfg.get("use_basic_auth"):
        headers.update(build_basic_auth_header(cfg.get("username", ""), cfg.get("password", "")))
    return headers
    # BACKEND-PLACEHOLDER-END
# BACKEND-PLACEHOLDER-END
