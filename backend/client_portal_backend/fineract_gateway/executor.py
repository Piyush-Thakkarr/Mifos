
"""
Fineract HTTP Executor.
Handles real HTTP calls to Fineract using urllib, adding headers, correlation IDs,
and error handling.
"""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple
import ssl

from .config import get_config
from .utils import build_headers_from_config, gen_correlation_id


@dataclass
class GatewayError(Exception):
    status: int
    message: str
    correlation_id: str

    def __str__(self) -> str:  # pragma: no cover
        return f"GatewayError(status={self.status}, cid={self.correlation_id}, msg={self.message})"


def _build_url(path: str, query: Optional[Dict[str, Any]] = None) -> str:
    cfg = get_config()
    base = (cfg.get("base_url") or "").rstrip("/")
    url = f"{base}{path}"
    if query:
        q = urllib.parse.urlencode(query, doseq=True)
        sep = "&" if ("?" in url) else "?"
        url = f"{url}{sep}{q}"
    return url


def execute_json(path: str,
                 method: str = "GET",
                 query: Optional[Dict[str, Any]] = None,
                 body: Optional[Dict[str, Any]] = None,
                 headers_override: Optional[Dict[str, str]] = None) -> Tuple[Dict[str, Any], str]:
    """Execute an HTTP call to Fineract and return (json_dict, correlation_id).

    Retries only for GET requests, using exponential backoff.
    Raises GatewayError for non-2xx or transport errors.
    """
    cfg = get_config()
    correlation_id = gen_correlation_id()
    headers = build_headers_from_config(correlation_id)
    if headers_override:
        headers.update({k: v for k, v in headers_override.items() if v is not None})
    # Guard against missing/invalid base URL to avoid ValueError from urllib
    base = (cfg.get("base_url") or "").strip()
    if not base or not (base.startswith("http://") or base.startswith("https://")):
        raise GatewayError(status=503, message="Fineract base URL not configured", correlation_id=correlation_id)
    url = _build_url(path, query)
    timeout = float(cfg.get("timeout", 10))
    max_retries = int(cfg.get("retries", 2)) if method.upper() == "GET" else 0

    attempt = 0
    while True:
        attempt += 1
        try:
            data_bytes = None
            if body is not None:
                data_bytes = json.dumps(body).encode("utf-8")
            req = urllib.request.Request(url=url, data=data_bytes, headers=headers, method=method.upper())
            # Disable SSL verification for local HTTPS endpoints (e.g., https://localhost:8443)
            context = ssl._create_unverified_context()
            with urllib.request.urlopen(req, timeout=timeout, context=context) as resp:
                status = getattr(resp, "status", 200)
                resp_body = resp.read() or b"{}"
                if 200 <= status < 300:
                    try:
                        return json.loads(resp_body.decode("utf-8")), correlation_id
                    except Exception:
                        # Non-JSON success payload
                        return {}, correlation_id
                # Non-2xx
                raise GatewayError(status=status, message=f"HTTP {status}", correlation_id=correlation_id)
        except urllib.error.HTTPError as e:
            status = getattr(e, "code", 502) or 502
            # Read body for logging if needed (not returned)
            raise GatewayError(status=status, message=f"HTTP {status}", correlation_id=correlation_id)
        except (urllib.error.URLError, TimeoutError) as e:
            # Network error; retry if allowed, else 503
            if attempt <= max_retries:
                time.sleep(0.3 * attempt)
                continue
            raise GatewayError(status=503, message="Upstream unavailable", correlation_id=correlation_id)

